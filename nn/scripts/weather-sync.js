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

    // Find the absolute oldest year present in this specific 50-item batch
    const earliestYear = new Date(Math.min(...chunkDates)).getFullYear();

    // Create a uniform window spanning from Feb 1st of that year to the newest batch date
    const uniformStartDate = earliestYear + "-02-01";
    const uniformEndDate = new Date(Math.max(...chunkDates)).toISOString().split('T')[0];
    
    const urlParams = new URLSearchParams({
      latitude: lats.join(','),
      longitude: lons.join(','),
      start_date: uniformStartDate, // Single uniform string for the whole batch
      end_date: uniformEndDate,     // Single uniform string for the whole batch
      daily: 'temperature_2m_max,temperature_2m_min',
      temperature_unit: 'fahrenheit',
      timezone: 'auto'
    });   

    const meteoUrl = cleanMeteoUrl + '?' + urlParams.toString();
    console.log(`Sending ONE safe request to Open-Meteo for new data rows...`);
    const meteoData = await makeHttpRequest(meteoUrl);

    // STEP 4: Append new entries and calculate cumulative MGDD from each item's specific Feb 1st
    // Calculate how many days are allocated to each individual location in the data pool
    const totalTimelineDays = meteoData?.daily?.time?.length || 0;
    const daysPerLocation = totalTimelineDays / lats.length;

    referenceMap.forEach((obsMeta, index) => {
      const rootDaily = meteoData?.daily;

      if (!rootDaily || !rootDaily.time || daysPerLocation === 0) {
        finalReport.push({
          obsId: obsMeta.obsId,
          date: obsMeta.date,
          coordinates: { lat: obsMeta.lat, lon: obsMeta.lon },
          mgdd: null
        });
        return;
      }

      // Calculate the starting position for this specific location's weather chunk
      const startOffset = index * daysPerLocation;
  
      // Extract the exact timeline slices belonging to this single observation
      const locationTimes = rootDaily.time.slice(startOffset, startOffset + daysPerLocation);
      const locationMaxs = rootDaily.temperature_2m_max ? rootDaily.temperature_2m_max.slice(startOffset, startOffset + daysPerLocation) : [];
      const locationMins = rootDaily.temperature_2m_min ? rootDaily.temperature_2m_min.slice(startOffset, startOffset + daysPerLocation) : [];

      let cumulativeMgdd = 0;
      const targetDateStr = String(obsMeta.date).slice(0, 10);

      // Loop through this observation's isolated slice of time
      for (let d = 0; d < locationTimes.length; d++) {
        const currentTimeStr = locationTimes[d];
    
        if (currentTimeStr > targetDateStr) break;

        const tmax = locationMaxs[d];
        const tmin = locationMins[d];

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

    // STEP 5: Save total updated array back to your file with one line per observation
    if (!fs.existsSync(outputDirectory)) {
      fs.mkdirSync(outputDirectory, { recursive: true });
    }

    // Build the array text line-by-line using a clean string collector
    let jsonLines = [];
    for (let i = 0; i < finalReport.length; i++) {
      const itemString = JSON.stringify(finalReport[i]);
      const isLastItem = (i === finalReport.length - 1);
  
      // Indent the object text and append a comma if it's not the final row
      if (isLastItem) {
        jsonLines.push("  " + itemString);
      } else {
        jsonLines.push("  " + itemString + ",");
      }
    }

    // Join the clean lines inside explicit top and bottom array brackets
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
