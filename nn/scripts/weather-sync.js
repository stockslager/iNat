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
      timezone: 'GMT'
    });

    const meteoUrl = cleanMeteoUrl + '?' + urlParams.toString();
    console.log(`Sending ONE safe request to Open-Meteo for new data rows...`);
    const meteoData = await makeHttpRequest(meteoUrl);

    // === STEP 4: Group observations by year and process clusters in distinct batch requests ===
    var groupsByYear = {};
    referenceMap.forEach(function(obs) {
      var year = obs.date.slice(0, 4);
      if (!groupsByYear[year]) {
        groupsByYear[year] = [];
      }
      groupsByYear[year].push(obs);
    });

    var yearsToProcess = Object.keys(groupsByYear);
    console.log('Processing weather data across ' + yearsToProcess.length + ' distinct year groups...');

    for (var y = 0; y < yearsToProcess.length; y++) {
      var currentYear = yearsToProcess[y];
      var batchRows = groupsByYear[currentYear];

      var batchLats = batchRows.map(function(r) { return r.lat; });
      var batchLons = batchRows.map(function(r) { return r.lon; });
      
      var chunkDates = batchRows.map(function(r) { return new Date(r.date); });
      var uniformStartDate = currentYear + '-02-01';
      var uniformEndDate = new Date(Math.max.apply(null, chunkDates)).toISOString().split('T')[0];

      console.log('Querying year group ' + currentYear + ' (' + batchRows.length + ' items, range: ' + uniformStartDate + ' to ' + uniformEndDate + ')');

      var urlParams = new URLSearchParams({
        latitude: batchLats.join(','),
        longitude: batchLons.join(','),
        start_date: uniformStartDate,
        end_date: uniformEndDate,
        daily: 'temperature_2m_max,temperature_2m_min',
        temperature_unit: 'fahrenheit',
        timezone: 'GMT'
      });

      var meteoUrl = cleanMeteoUrl + '?' + urlParams.toString();
      
      try {
        var meteoData = await makeHttpRequest(meteoUrl);
        var rootDaily = meteoData ? meteoData.daily : null;
        var totalTimelineDays = rootDaily && rootDaily.time ? rootDaily.time.length : 0;
        var daysPerLocation = batchLats.length > 0 ? totalTimelineDays / batchLats.length : 0;

        batchRows.forEach(function(obsMeta, index) {
          if (!rootDaily || !rootDaily.time || daysPerLocation === 0) {
            finalReport.push({ obsId: obsMeta.obsId, date: obsMeta.date, coordinates: { lat: obsMeta.lat, lon: obsMeta.lon }, mgdd: null });
            return;
          }

          var startOffset = index * daysPerLocation;
          var locationTimes = rootDaily.time.slice(startOffset, startOffset + daysPerLocation);
          var locationMaxs = rootDaily.temperature_2m_max ? rootDaily.temperature_2m_max.slice(startOffset, startOffset + daysPerLocation) : [];
          var locationMins = rootDaily.temperature_2m_min ? rootDaily.temperature_2m_min.slice(startOffset, startOffset + daysPerLocation) : [];

          var cumulativeMgdd = 0;
          var targetDateStr = obsMeta.date;
          var internalStartDate = currentYear + '-02-01';

          for (var d = 0; d < locationTimes.length; d++) {
            var currentTimeStr = locationTimes[d];
            if (currentTimeStr < internalStartDate) continue;
            if (currentTimeStr > targetDateStr) break;

            var tmax = locationMaxs[d];
            var tmin = locationMins[d];

            if (tmax !== null && tmin !== null) {
              var adjustedMax = Math.max(50, Math.min(86, tmax));
              var adjustedMin = Math.max(50, Math.min(86, tmin));
              var dailyGdd = ((adjustedMax + adjustedMin) / 2) - 50;
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

      } catch (err) {
        console.error('API Group Call failed for year ' + currentYear + ':', err.message);
        batchRows.forEach(function(obsMeta) {
          finalReport.push({ obsId: obsMeta.obsId, date: obsMeta.date, coordinates: { lat: obsMeta.lat, lon: obsMeta.lon }, mgdd: null });
        });
      }

      if (y < yearsToProcess.length - 1) {
        await delay(2000); // 2-second buffer between year transactions to prevent rate thresholds
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

