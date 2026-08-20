const fs = require('fs');
const path = require('path');
const https = require('https');

const baseProtocol = "https://";
const apiSubdomain = "archive-api";
const apiDomain = "open-meteo";
const apiTld = "com";
const apiPath = "/v1/archive";
const cleanMeteoUrl = baseProtocol + apiSubdomain + "." + apiDomain + "." + apiTld + apiPath;

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function makeHttpRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error("Failed to parse JSON response"));
          }
        } else {
          reject(new Error(`Server returned status code: ${res.statusCode}`));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function runBackendSync() {
  try {
    const projectId = "304098";
    const outputDirectory = path.join(__dirname, '../data');
    const filePath = path.join(outputDirectory, 'weather-cache.json');

    // STEP 1: Load existing cache file
    let finalReport = [];
    let existingIds = new Set();
    if (fs.existsSync(filePath)) {
      try {
        finalReport = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        existingIds = new Set(finalReport.map(item => String(item.obsId)));
        console.log(`Loaded ${finalReport.length} existing records from cache.`);
      } catch (e) {
        console.log("Weather cache file was empty or invalid. Starting fresh.");
      }
    }

    // STEP 2: Download data from iNaturalist
    let allObservations = [];
    let currentPage = 1;
    let keepFetching = true;
    console.log(`Checking iNaturalist for data updates...`);

    while (keepFetching) {
      const inatUrl = ('https://api.inaturalist.org/v1/observations?project_id=304098&per_page=200&page=' + currentPage);
      const obs_data = await makeHttpRequest(inatUrl);
      const batchResults = obs_data.results || [];
      allObservations = allObservations.concat(batchResults);
      if (batchResults.length < 200) {
        keepFetching = false;
      } else {
        currentPage++;
        await delay(2000);
      }
    }

    const validObs = allObservations.filter(obs => obs.geojson && obs.geojson.coordinates);
    const missingObs = validObs.filter(obs => !existingIds.has(String(obs.id)));

    if (missingObs.length === 0) {
      console.log("SUCCESS: Everything is up to date! Zero requests sent to Open-Meteo.");
      return finalReport;
    }

    console.log(`Found ${missingObs.length} new observations requiring weather lookups.`);
    const cappedObs = missingObs.slice(0, 50);
    console.log(`Capping this block at ${cappedObs.length} entries to protect limits.`);

    // Map your new coordinates
    const referenceMap = cappedObs.map((obs) => {
      const [lon, lat] = obs.geojson.coordinates;
      let targetDate = obs.observed_on_details?.date;
      if (!targetDate && obs.created_at) {
        targetDate = obs.created_at.split('T')[0];
      }
      return { 
        obsId: obs.id, 
        date: String(targetDate).slice(0, 10), 
        lat: Number(lat).toFixed(4), 
        lon: Number(lon).toFixed(4) 
      };
    });

    const lats = referenceMap.map(r => r.lat);
    const lons = referenceMap.map(r => r.lon);

    // Extract years as text and find the oldest baseline anchor safely
    const yearStrings = referenceMap.map(r => r.date.slice(0, 4));
    const uniqueYears = [...new Set(yearStrings)].map(Number);
    const earliestYear = Math.min(...uniqueYears);

    // Define the single global maximum wide envelope boundaries
    const uniformStartDate = earliestYear + "-02-01";
    const uniformEndDate = new Date().toISOString().split('T')[0];

    const urlParams = new URLSearchParams({
      latitude: lats.join(','),
      longitude: lons.join(','),
      start_date: uniformStartDate,
      end_date: uniformEndDate,
      daily: 'temperature_2m_max,temperature_2m_min',
      temperature_unit: 'fahrenheit',
      timezone: 'auto'
    });

    const meteoUrl = cleanMeteoUrl + '?' + urlParams.toString();
    console.log(`Sending ONE safe request to Open-Meteo for new data rows...`);
    const meteoData = await makeHttpRequest(meteoUrl);

// STEP 4: Append new entries and calculate cumulative MGDD cleanly
referenceMap.forEach((obsMeta, index) => {
    // 1. Move variable declarations to the VERY TOP of the loop iteration
    const targetDateStr = obsMeta.date;
    const obsYear = targetDateStr.slice(0, 4);
    const internalStartDate = obsYear + "-02-01";

    // 2. Safely capture the correct location object from multi-row coordinates responses
    const weatherRecord = Array.isArray(meteoData) ? meteoData[index] : meteoData;
    const dailyTimeline = weatherRecord?.daily;

    if (!dailyTimeline || !dailyTimeline.time) {
        finalReport.push({ 
            obsId: obsMeta.obsId, 
            date: targetDateStr, 
            coordinates: { lat: obsMeta.lat, lon: obsMeta.lon }, 
            mgdd: null 
        });
        return;
    }

    // 3. Your diagnostic logging block now safely reads initialized variables
    if (String(obsMeta.obsId) === '173920616') {
        console.log('================================================================================');
        console.log('=== SERVER-SIDE DAILY BREAKDOWN HISTORY FOR OBS ID: 173920616 ===');
        console.log('Coordinates: Lat ' + obsMeta.lat + ', Lon ' + obsMeta.lon);
        console.log('Target Cutoff Date: ' + targetDateStr);
        console.log('--------------------------------------------------------------------------------');
        console.log('DATE       | RAW MAX | RAW MIN | ADJUST MAX | ADJUST MIN | DAILY GDD | RUNNING TOTAL');
        console.log('--------------------------------------------------------------------------------');
        
        let debugRunningTotal = 0;
        for (let d = 0; d < dailyTimeline.time.length; d++) {
            const checkDate = dailyTimeline.time[d];
            if (checkDate < internalStartDate) continue;
            if (checkDate > targetDateStr) break;

            const tmax = dailyTimeline.temperature_2m_max ? dailyTimeline.temperature_2m_max[d] : null;
            const tmin = dailyTimeline.temperature_2m_min ? dailyTimeline.temperature_2m_min[d] : null;
            
            let dailyGdd = 0;
            let adjMax = 'N/A';
            let adjMin = 'N/A';

            if (tmax !== null && tmin !== null) {
                const adjustedMax = Math.max(50, Math.min(86, tmax));
                const adjustedMin = Math.max(50, Math.min(86, tmin));
                adjMax = adjustedMax.toFixed(1);
                adjMin = adjustedMin.toFixed(1);
                const rawGdd = ((adjustedMax + adjustedMin) / 2) - 50;
                if (rawGdd > 0) {
                    dailyGdd = rawGdd;
                    debugRunningTotal += dailyGdd;
                }
            }

            const padDate = (checkDate + '          ').slice(0, 10);
            const padRawMax = ((tmax !== null ? tmax.toFixed(1) : 'N/A') + '       ').slice(0, 7);
            const padRawMin = ((tmin !== null ? tmin.toFixed(1) : 'N/A') + '       ').slice(0, 7);
            const padAdjMax = (adjMax + '          ').slice(0, 10);
            const padAdjMin = (adjMin + '          ').slice(0, 10);
            const padGdd = ('+' + dailyGdd.toFixed(1) + '         ').slice(0, 9);
            
            console.log(padDate + ' | ' + padRawMax + ' | ' + padRawMin + ' | ' + padAdjMax + ' | ' + padAdjMin + ' | ' + padGdd + ' | ' + Math.round(debugRunningTotal));
        }
        console.log('--------------------------------------------------------------------------------');
        console.log('FINAL ROUNDED SERVER SCORE: ' + Math.round(debugRunningTotal) + ' MGDD');
        console.log('================================================================================');
    }

    // 4. Primary Calculation Routine
    let cumulativeMgdd = 0;
    for (let d = 0; d < dailyTimeline.time.length; d++) {
        const currentTimeStr = dailyTimeline.time[d];
        if (currentTimeStr < internalStartDate) continue;
        if (currentTimeStr > targetDateStr) break;

        const tmax = dailyTimeline.temperature_2m_max ? dailyTimeline.temperature_2m_max[d] : null;
        const tmin = dailyTimeline.temperature_2m_min ? dailyTimeline.temperature_2m_min[d] : null;

        if (tmax !== null && tmin !== null) {
            const adjustedMax = Math.max(50, Math.min(86, tmax));
            const adjustedMin = Math.max(50, Math.min(86, tmin));
            const dailyGdd = ((adjustedMax + adjustedMin) / 2) - 50;

            if (dailyGdd > 0) {
                cumulativeMgdd += dailyGdd;
            }
        }
    }

    finalReport.push({ 
        obsId: obsMeta.obsId, 
        date: targetDateStr, 
        coordinates: { lat: obsMeta.lat, lon: obsMeta.lon }, 
        mgdd: Math.round(cumulativeMgdd) 
    });
});

    // STEP 5: Save updated array back to file
    if (!fs.existsSync(outputDirectory)) {
      fs.mkdirSync(outputDirectory, { recursive: true });
    }

    let jsonLines = [];
    for (let i = 0; i < finalReport.length; i++) {
      const itemString = JSON.stringify(finalReport[i]);
      const isLastItem = (i === finalReport.length - 1);
      if (isLastItem) {
        jsonLines.push("  " + itemString);
      } else {
        jsonLines.push("  " + itemString + ",");
      }
    }

    const formattedFileText = "[\n" + jsonLines.join("\n") + "\n]";
    fs.writeFileSync(filePath, formattedFileText);
    console.log(`SUCCESS: Weather file updated. Total items cached: ${finalReport.length}`);
    return finalReport;

  } catch (error) {
    console.error("Workflow collection failed:", error.message);
    process.exit(1);
  }
}

runBackendSync();
