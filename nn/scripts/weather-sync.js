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
        lat: Number(lat).toFixed(2), 
        lon: Number(lon).toFixed(2) 
      };
    });

    // === STEP 4: Process each observation individually using isolated block parameters ===
    console.log('Processing ' + cappedObs.length + ' observations one-by-one...');

    for (let i = 0; i < cappedObs.length; i++) {
      const obs = cappedObs[i];
      
      const lon = obs.geojson.coordinates[0];
      const lat = obs.geojson.coordinates[1];
      const cleanLat = Number(lat).toFixed(2);
      const cleanLon = Number(lon).toFixed(2);
      
      const targetDateStr = obs.date;
      const obsYear = targetDateStr.slice(0, 4);
      const internalStartDate = obsYear + '-02-01';

      console.log('[' + (i + 1) + '/' + cappedObs.length + '] Fetching ID: ' + obs.obsId);

      const urlParams = new URLSearchParams({
        latitude: cleanLat,
        longitude: cleanLon,
        start_date: internalStartDate,
        end_date: targetDateStr,
        daily: 'temperature_2m_max,temperature_2m_min',
        temperature_unit: 'fahrenheit',
        timezone: 'GMT'
      });

      const meteoUrl = 'https://open-meteo.com?' + urlParams.toString();
      
      try {
        const meteoData = await makeHttpRequest(meteoUrl);
        const dailyTimeline = meteoData ? meteoData.daily : null;

        if (!dailyTimeline || !dailyTimeline.time) {
          console.warn('No weather data payload returned for ID: ' + obs.obsId);
          finalReport.push({ obsId: obs.obsId, date: targetDateStr, coordinates: { lat: cleanLat, lon: cleanLon }, mgdd: null });
          continue;
        }

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
          obsId: obs.obsId,
          date: targetDateStr,
          coordinates: { lat: cleanLat, lon: cleanLon },
          mgdd: Math.round(cumulativeMgdd)
        });

        // 200ms delay to space out transactions under the 60-req/min ceiling
        await delay(200);

      } catch (err) {
        console.error('Failed lookup for ID ' + obs.obsId + ':', err.message);
        finalReport.push({ obsId: obs.obsId, date: targetDateStr, coordinates: { lat: cleanLat, lon: cleanLon }, mgdd: null });
      }
    }
    // === END OF STEP 4 ===

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

