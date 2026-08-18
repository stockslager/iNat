const fs = require('fs');
const path = require('path');

async function runBackendSync() {
  try {
      // Await the result of getObservations() and store the actual data
      const config  = await asyncGetConfiguration( '../core/json/firefly_patterns', 'studies', 'Firefly+Patterns' );
      console.log('full config title: ' + config.getFullTitle());          
      const api_params    = setupAPIParams( config );
      const api_url       = api_base+api_params;
      console.log('api url: ' + api_url);
      const obs_data      = await apiFetch( api_url ); 
             
      // Filter out any observations missing geolocation coordinates to prepare for
      // fetch of mateo mgdd data.
      const validObs = obs_data.results.filter(obs_data => obs_data.geojson && obs_data.geojson.coordinates);

      if( validObs.length === 0) {
          console.log("No observations found with valid coordinates.");
          return;
      }

      //****************************
      // move to it's own function
      //****************************
    // 2. Prepare arrays for Open-Meteo batching and map the index tracking
    const lats = [];
    const lons = [];
    const referenceMap = [];

    validObs.forEach((obs) => {
      // iNat GeoJSON is [longitude, latitude]
      const [lon, lat] = obs.geojson.coordinates;
      lats.push(lat);
      lons.push(lon);
      
      // Keep track of the metadata in the exact same array order
      referenceMap.push({
        obsId: obs.id,
        date: obs.observed_on_details?.date || obs.created_at.split('T')[0], // Falls back to upload date if observation date is missing
        lat,
        lon
      });
    });

    // Determine global start and end dates to encompass all observations in one batch
    const dates = referenceMap.map(r => new Date(r.date));
    const minDate = new Date(Math.min(...dates)).toISOString().split('T')[0];
    const maxDate = new Date(Math.max(...dates)).toISOString().split('T')[0];

    // 3. Construct the Open-Meteo batch API request
// Built manually to force a secure, un-scrubbed API route configuration
const baseProtocol = "https://";
const apiSubdomain = "archive-api";
const apiDomain = "open-meteo";
const apiTld = "com";
const apiPath = "/v1/archive";

const cleanBaseUrl = baseProtocol + apiSubdomain + "." + apiDomain + "." + apiTld + apiPath;
             
    const meteoUrl = new URL(cleanBaseUrl);    
             
    meteoUrl.searchParams.append('latitude', lats.join(','));
    meteoUrl.searchParams.append('longitude', lons.join(','));
    meteoUrl.searchParams.append('start_date', minDate);
    meteoUrl.searchParams.append('end_date', maxDate);
    meteoUrl.searchParams.append('daily', 'temperature_2m_max,temperature_2m_min');
    meteoUrl.searchParams.append('temperature_unit', 'fahrenheit');
    meteoUrl.searchParams.append('timezone', 'auto');

    console.log(`Querying Open-Meteo for dates between ${minDate} and ${maxDate}...`);
    const meteoResponse = await fetch(meteoUrl);
// ADD THESE THREE LINES TO CATCH THE ERROR IMMEDIATELY
console.log("meteo HTTP Status:", meteoResponse.status);
console.log("meteo Content Type:", meteoResponse.headers.get("content-type"));
             
const meteoData = await meteoResponse.json();
    console.log('query complete');

    // Handle responses whether it returns a single object (1 location) or an array (multiple locations)
    const locationsWeatherData = Array.isArray(meteoData) ? meteoData : [meteoData];

    // 4. Map the weather results back to the iNat Obs IDs
// 4. Map the weather results back to the iNat Obs IDs 
const finalReport = referenceMap.map((obsMeta, index) => {
  
  // Extract the individual weather record for this specific location index
  // Handles both a flat array (batch) or a fallback single object
  const weatherRecord = Array.isArray(meteoData) ? meteoData[index] : meteoData;
  const dailyTimeline = weatherRecord?.daily;

  // SAFETY GUARD: If this specific coordinate index has no daily data, skip safely
  if (!dailyTimeline || !dailyTimeline.time) {
    console.warn(`No timeline structure found for index ${index} (Obs ID: ${obsMeta.obsId})`);
    return { obsId: obsMeta.obsId, date: obsMeta.date, tmax: null, tmin: null };
  }

  // Find the position of the observation's date in this location's timeline array
  const cleanInatTargetDate = String(obsMeta.date).slice(0, 10);
  const dateIndex = dailyTimeline.time.findIndex(timeStr => String(timeStr).slice(0, 10) === cleanInatTargetDate); 

  let tmax = null; 
  let tmin = null; 

  // Pull the scalar max/min values out of the timelines for that specific day
  if (dateIndex !== -1) {
    tmax = dailyTimeline.temperature_2m_max ? dailyTimeline.temperature_2m_max[dateIndex] : null;
    tmin = dailyTimeline.temperature_2m_min ? dailyTimeline.temperature_2m_min[dateIndex] : null;
  } else {
    console.warn(`Date ${cleanInatTargetDate} not found in weather timeline for Obs ID: ${obsMeta.obsId}`);
  }

  return { 
    obsId: obsMeta.obsId, 
    date: cleanInatTargetDate, 
    coordinates: { lat: obsMeta.lat, lon: obsMeta.lon }, 
    tmax, 
    tmin 
  }; 
});

console.log("Successfully paired iNat observations with local weather data:");
console.log(finalReport);

    console.log("Successfully paired iNat observations with local weather data:");
    console.log(finalReport);
    return finalReport;

    // At the end of your script, instead of calling fresults() to render HTML:
    const outputDirectory = path.join(__dirname, '../data');
    if (!fs.existsSync(outputDirectory)) {
      fs.mkdirSync(outputDirectory);
    }

    const filePath = path.join(outputDirectory, 'weather-cache.json');
    
    // Save the array as a clean, static JSON string file in your repository
    fs.writeFileSync(filePath, JSON.stringify(finalReport, null, 2));
    console.log("Successfully wrote automated data update to weather-cache.json");

  } catch (error) {
    console.error("Workflow collection failed:", error);
    process.exit(1); // Forces GitHub Actions to report a failure if the API drops
  }
}

runBackendSync();
