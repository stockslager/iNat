const fs = require('fs');
const path = require('path');
const https = require('https');

// Secure User-Agent string header mandatory for all federal api.weather.gov transactions
const requestHeaders = {
  'User-Agent': 'iNaturalist-MGDD-Sync-Tool-Educational-Utility (Contact: [jason.stockslager@gmail.com])'
};

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function makeHttpRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: requestHeaders }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Failed to parse JSON response'));
          }
        } else {
          // Reject with custom object to capture exact response codes like 404
          const errorObj = new Error(`Server returned status code: ${res.statusCode}`);
          errorObj.statusCode = res.statusCode;
          reject(errorObj);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function runBackendSync() {
  try {
    const projectId = 304098;
    const outputDirectory = path.join(__dirname, '../data');
    const filePath = path.join(outputDirectory, 'weather-cache.json');

    // STEP 1: Load existing cache file layout
    let finalReport = [];
    let existingIds = new Set();
    if (fs.existsSync(filePath)) {
      try {
        finalReport = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        existingIds = new Set(finalReport.map(item => String(item.obsId)));
        console.log('Loaded ' + finalReport.length + ' existing records from cache.');
      } catch (e) {
        console.log('Weather cache file was empty or invalid. Starting fresh.');
      }
    }

    // STEP 2: Download active project observations from iNaturalist
    let allObservations = [];
    let currentPage = 1;
    let keepFetching = true;
    console.log('Checking iNaturalist for data updates...');

    while (keepFetching) {
      var inatUrl = 'https://api.inaturalist.org/v1/observations?project_id=304098&per_page=200&page=' + currentPage;
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
      console.log('SUCCESS: Everything is up to date! Zero requests sent to NWS.');
      return finalReport;
    }

    console.log('Found ' + missingObs.length + ' new observations requiring weather lookups.');
    const cappedObs = missingObs.slice(0, 50);
    console.log('Capping this block at ' + cappedObs.length + ' entries to protect limits.');

    // STEP 3: Map new coordinates safely using original indexing
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

    // STEP 4: Process observations one-by-one via NWS gridpoint matching
    console.log('Processing ' + referenceMap.length + ' locations using NWS endpoint grids...');

    for (let i = 0; i < referenceMap.length; i++) {
      const obsMeta = referenceMap[i];
      const targetDateStr = obsMeta.date;
      const obsYear = targetDateStr.slice(0, 4);
      const internalStartDate = obsYear + '-02-01';

      console.log('[' + (i + 1) + '/' + referenceMap.length + '] Checking ID ' + obsMeta.obsId + ' (Lat: ' + obsMeta.lat + ', Lon: ' + obsMeta.lon + ')');

      // Point-to-Grid metadata verification query
      const pointLookupUrl = 'https://api.weather.gov/points/' + obsMeta.lat + ',' + obsMeta.lon;
      
      try {
        const pointMetadata = await makeHttpRequest(pointLookupUrl);
        const gridDataUrl = pointMetadata?.properties?.forecastGridData;

        if (!gridDataUrl) {
          console.warn(`-> Skipping ID ${obsMeta.obsId}: Coordinates exist outside standard NWS tracking footprint.`);
          finalReport.push({ obsId: obsMeta.obsId, date: targetDateStr, coordinates: { lat: obsMeta.lat, lon: obsMeta.lon }, mgdd: null });
          continue;
        }

        // Fetch daily climate grid telemetry arrays
        const rawGridPayload = await makeHttpRequest(gridDataUrl);
        const properties = rawGridPayload?.properties;

        // Isolate temperature arrays (values return in degrees Celsius from NWS)
        const maxTempValues = properties?.maxTemperature?.values || [];
        const minTempValues = properties?.minTemperature?.values || [];

        // Map values array to structural dates dictionary
        let dailyMaxMap = {};
        let dailyMinMap = {};

        maxTempValues.forEach(item => {
          if (item.validTime) {
            // FIXED: Cleanly isolate only the first 10 characters (YYYY-MM-DD)
            const cleanKey = String(item.validTime).slice(0, 10);
            const fahrenheitValue = (item.value * 9 / 5) + 32;
            
            // Keep the highest recorded entry if the NWS grid breaks down temperatures into small hour chunks
            if (!dailyMaxMap[cleanKey] || fahrenheitValue > dailyMaxMap[cleanKey]) {
              dailyMaxMap[cleanKey] = fahrenheitValue;
            }
          }
        });

        minTempValues.forEach(item => {
          if (item.validTime) {
            // FIXED: Cleanly isolate only the first 10 characters (YYYY-MM-DD)
            const cleanKey = String(item.validTime).slice(0, 10);
            const fahrenheitValue = (item.value * 9 / 5) + 32;
            
            // Keep the lowest recorded entry if the NWS grid breaks down temperatures into small hour chunks
            if (!dailyMinMap[cleanKey] || fahrenheitValue < dailyMinMap[cleanKey]) {
              dailyMinMap[cleanKey] = fahrenheitValue;
            }
          }
        });

        // Loop chronologically from Feb 1st up to the targeted observation timestamp day
        let cumulativeMgdd = 0;
        let currentDateLoop = new Date(internalStartDate + 'T12:00:00Z');
        const endDateObj = new Date(targetDateStr + 'T12:00:00Z');

        while (currentDateLoop <= endDateObj) {
          const dateStringKey = currentDateLoop.toISOString().split('T')[0];
          
          const tmax = dailyMaxMap[dateStringKey] !== undefined ? dailyMaxMap[dateStringKey] : null;
          const tmin = dailyMinMap[dateStringKey] !== undefined ? dailyMinMap[dateStringKey] : null;

          if (tmax !== null && tmin !== null) {
            const adjustedMax = Math.max(50, Math.min(86, tmax));
            const adjustedMin = Math.max(50, Math.min(86, tmin));
            const dailyGdd = ((adjustedMax + adjustedMin) / 2) - 50;
            if (dailyGdd > 0) {
              cumulativeMgdd += dailyGdd;
            }
          }
          currentDateLoop.setUTCDate(currentDateLoop.getUTCDate() + 1);
        }

        finalReport.push({
          obsId: obsMeta.obsId,
          date: targetDateStr,
          coordinates: { lat: obsMeta.lat, lon: obsMeta.lon },
          mgdd: Math.round(cumulativeMgdd)
        });

      } catch (innerErr) {
        // Intercept 404 or point query failures to gracefully slide past international coordinates
        if (innerErr.statusCode === 404) {
          console.warn(`-> Skipping ID ${obsMeta.obsId}: International boundary detected (HTTP 404).`);
        } else {
          console.error(`-> Failed tracking for ID ${obsMeta.obsId}:`, innerErr.message);
        }
        finalReport.push({ obsId: obsMeta.obsId, date: targetDateStr, coordinates: { lat: obsMeta.lat, lon: obsMeta.lon }, mgdd: null });
      }

      // Safe 150ms structural rest parameter spacing out calls to be courteous
      await delay(150);
    }

    // STEP 5: Save updated array back to file
    if (!fs.existsSync(outputDirectory)) {
      fs.mkdirSync(outputDirectory, { recursive: true });
    }

    let jsonLines = [];
    for (let i = 0; i < finalReport.length; i++) {
      const itemString = JSON.stringify(finalReport[i]);
      const isLastItem = (i === finalReport.length - 1);
      if (isLastItem) {
        jsonLines.push('  ' + itemString);
      } else {
        jsonLines.push('  ' + itemString + ',');
      }
    }

    const formattedFileText = '[\n' + jsonLines.join('\n') + '\n]';
    fs.writeFileSync(filePath, formattedFileText);
    console.log(`SUCCESS: Weather file updated via NWS. Total items cached: ${finalReport.length}`);
    return finalReport;

  } catch (error) {
    console.error('Workflow collection failed:', error.message);
    process.exit(1);
  }
}

runBackendSync();


