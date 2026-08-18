const fs = require('fs'); 
console.log("=== VERIFYING SCRIPT VERSION: RUNNING MY NEW STEP 5 CODE ==="
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
          try { resolve(JSON.parse(data)); } catch (e) { reject(new Error("Failed to parse JSON response")); }
        } else { reject(new Error(`Server returned status code: ${res.statusCode}`)); }
      });
    }).on('error', (err) => { reject(err); });
  });
} 

async function runBackendSync() { 
  try { 
    const projectId = "304098"; 
    const outputDirectory = path.join(__dirname, '../data'); 
    const filePath = path.join(outputDirectory, 'weather-cache.json'); 
    
    // STEP 1: Load your existing cache file if it exists
    let finalReport = [];
    let existingIds = new Set();
    
    if (fs.existsSync(filePath)) {
      try {
        finalReport = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        existingIds = new Set(finalReport.map(item => String(item.obsId)));
        console.log(`Loaded ${finalReport.length} existing records from your weather cache.`);
      } catch (e) {
        console.log("Weather cache file was empty or invalid. Starting fresh.");
      }
    }

    // STEP 2: Download your project data from iNaturalist using a safe page loop
    let allObservations = [];
    let currentPage = 1;
    let keepFetching = true;

    console.log(`Checking iNaturalist for data updates...`);
    while (keepFetching) {
      const inatUrl = `https://api.inaturalist.org/v1/observations?project_id=304098&per_page=200&page=${currentPage}`;
      const obs_data = await makeHttpRequest(inatUrl);
      const batchResults = obs_data.results || [];
      
      allObservations = allObservations.concat(batchResults);
      
      if (batchResults.length < 200) {
        keepFetching = false;
      } else {
        currentPage++;
        await delay(2000); // Safe 2-second pause for iNaturalist limits
      }
    }

    // Filter down to valid coordinates
    const validObs = allObservations.filter(obs => obs.geojson && obs.geojson.coordinates); 

    // STEP 3: Identify observations missing from the cache
    const missingObs = validObs.filter(obs => !existingIds.has(String(obs.id)));
    
    if (missingObs.length === 0) {
      console.log("SUCCESS: Everything is up to date! Zero requests sent to Open-Meteo.");
      return finalReport;
    }

    console.log(`Found ${missingObs.length} new observations requiring weather lookups.`);

    // === CRITICAL FIX: HARD CAP THE WEATHER QUERY AT 50 ENTRIES ===
    // If more than 50 items were added, it chops off the rest and catches them tomorrow night!
    const cappedObs = missingObs.slice(0, 50);
    console.log(`Capping this execution block at ${cappedObs.length} entries to protect Open-Meteo threshold limits.`);

    // Map your new coordinates
    const referenceMap = cappedObs.map((obs) => {
      const [lon, lat] = obs.geojson.coordinates;
  
      // Safe extraction of YYYY-MM-DD
      let targetDate = obs.observed_on_details?.date;
      if (!targetDate && obs.created_at) {
        targetDate = obs.created_at.split('T')[0]; // Grab the first element string
      }

      return {
        obsId: obs.id,
        date: targetDate,
        lat: Number(lat).toFixed(2),
        lon: Number(lon).toFixed(2)
      };
    });

    const lats = referenceMap.map(r => r.lat);
    const lons = referenceMap.map(r => r.lon);

    const chunkDates = referenceMap.map(r => new Date(r.date));
    const minDate = new Date(Math.min(...chunkDates)).toISOString().split('T')[0];
    const maxDate = new Date(Math.max(...chunkDates)).toISOString().split('T')[0];

    const urlParams = new URLSearchParams({
      latitude: lats.join(','),
      longitude: lons.join(','),
      start_date: minDate,
      end_date: maxDate,
      daily: 'temperature_2m_max,temperature_2m_min',
      temperature_unit: 'fahrenheit',
      timezone: 'auto'
    });

    const meteoUrl = cleanMeteoUrl + '?' + urlParams.toString();
    console.log(`Sending ONE safe request to Open-Meteo for new data rows...`);
    const meteoData = await makeHttpRequest(meteoUrl);

    // STEP 4: Append new entries directly onto your existing data array layout
    referenceMap.forEach((obsMeta, index) => {
      const weatherRecord = Array.isArray(meteoData) ? meteoData[index] : meteoData;
      const dailyTimeline = weatherRecord?.daily;

      if (!dailyTimeline || !dailyTimeline.time) {
        finalReport.push({ obsId: obsMeta.obsId, date: obsMeta.date, coordinates: { lat: obsMeta.lat, lon: obsMeta.lon }, tmax: null, tmin: null });
        return;
      }

      const cleanInatTargetDate = String(obsMeta.date).slice(0, 10);
      const dateIndex = dailyTimeline.time.findIndex(timeStr => String(timeStr).slice(0, 10) === cleanInatTargetDate);

      let tmax = null;
      let tmin = null;

      if (dateIndex !== -1) {
        tmax = dailyTimeline.temperature_2m_max ? dailyTimeline.temperature_2m_max[dateIndex] : null;
        tmin = dailyTimeline.temperature_2m_min ? dailyTimeline.temperature_2m_min[dateIndex] : null;
      }

      finalReport.push({
        obsId: obsMeta.obsId,
        date: cleanInatTargetDate,
        coordinates: { lat: obsMeta.lat, lon: obsMeta.lon },
        tmax,
        tmin
      });
    });

    // STEP 5: Save total updated array back to your file with one line per observation
if (!fs.existsSync(outputDirectory)) {
  fs.mkdirSync(outputDirectory, { recursive: true });
}

// Map each row with an explicit trailing carriage return and newline
const rows = finalReport.map((item, index) => {
  const isLast = index === finalReport.length - 1;
  return `  ${JSON.stringify(item)}${isLast ? '' : ','}`;
});

// Join the outer array layers with \r\n so your editor cannot merge them
const perfectArrayJson = `[\r\n${rows.join('\r\n')}\r\n]`;

fs.writeFileSync(filePath, perfectArrayJson);
console.log(`SUCCESS: Weather file updated. Total items cached: ${finalReport.length}`);
return finalReport;
    
  } catch (error) { 
    console.error("Workflow collection failed:", error.message); 
    process.exit(1); 
  } 
} 

runBackendSync();
