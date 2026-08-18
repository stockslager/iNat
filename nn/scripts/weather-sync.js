const fs = require('fs'); 
const path = require('path'); 

async function runBackendSync() { 
  try { 
    // 1. Read the raw observations file downloaded by GitHub Actions
    const rawDataPath = path.join(__dirname, '../data/raw-obs.json');
    
    if (!fs.existsSync(rawDataPath)) {
      throw new Error(`Could not find the downloaded observation file at: ${rawDataPath}`);
    }

    const fileContent = fs.readFileSync(rawDataPath, 'utf8');
    const obs_data = JSON.parse(fileContent);
    console.log(`Successfully loaded ${obs_data.results?.length || 0} observations from disk.`);

    // Filter out any observations missing geolocation coordinates
    const validObs = obs_data.results.filter(obs => obs.geojson && obs.geojson.coordinates); 
    if (validObs.length === 0) { 
      console.log("No observations found with valid coordinates."); 
      return; 
    } 

    // 2. Prepare arrays for Open-Meteo batching and map the index tracking 
    const lats = []; 
    const lons = []; 
    const referenceMap = []; 

    validObs.forEach((obs) => { 
      const [lon, lat] = obs.geojson.coordinates; 
      lats.push(lat); 
      lons.push(lon); 
      
      referenceMap.push({ 
        obsId: obs.id, 
        date: obs.observed_on_details?.date || obs.created_at.split('T'), 
        lat, 
        lon 
      }); 
    }); 

    // Determine global start and end dates to encompass all observations in one batch 
    const dates = referenceMap.map(r => new Date(r.date)); 
    const minDate = new Date(Math.min(...dates)).toISOString().split('T'); 
    const maxDate = new Date(Math.max(...dates)).toISOString().split('T'); 

    // 3. Construct the Open-Meteo batch API request securely
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
    
    console.log("meteo HTTP Status:", meteoResponse.status); 
    const meteoData = await meteoResponse.json(); 
    console.log('query complete'); 

    // 4. Map the weather results back to the iNat Obs IDs 
    const finalReport = referenceMap.map((obsMeta, index) => { 
      const weatherRecord = Array.isArray(meteoData) ? meteoData[index] : meteoData; 
      const dailyTimeline = weatherRecord?.daily; 

      if (!dailyTimeline || !dailyTimeline.time) { 
        console.warn(`No timeline structure found for index ${index} (Obs ID: ${obsMeta.obsId})`); 
        return { obsId: obsMeta.obsId, date: obsMeta.date, tmax: null, tmin: null }; 
      } 

      const cleanInatTargetDate = String(obsMeta.date).slice(0, 10); 
      const dateIndex = dailyTimeline.time.findIndex(timeStr => String(timeStr).slice(0, 10) === cleanInatTargetDate); 

      let tmax = null; 
      let tmin = null; 

      if (dateIndex !== -1) { 
        tmax = dailyTimeline.temperature_2m_max ? dailyTimeline.temperature_2m_max[dateIndex] : null; 
        tmin = dailyTimeline.temperature_2m_min ? dailyTimeline.temperature_2m_min[dateIndex] : null; 
      } 

      return { 
        obsId: obsMeta.obsId, 
        date: cleanInatTargetDate, 
        coordinates: { lat: obsMeta.lat, lon: obsMeta.lon }, 
        tmax, 
        tmin 
      }; 
    }); 

    // 5. Save the array as a clean, static JSON string file in your repository 
    const outputDirectory = path.join(__dirname, '../data'); 
    if (!fs.existsSync(outputDirectory)) { 
      fs.mkdirSync(outputDirectory); 
    } 

    const filePath = path.join(outputDirectory, 'weather-cache.json'); 
    fs.writeFileSync(filePath, JSON.stringify(finalReport, null, 2)); 
    console.log("Successfully wrote automated data update to weather-cache.json"); 

    return finalReport;

  } catch (error) { 
    console.error("Workflow collection failed:", error); 
    process.exit(1); 
  } 
} 

runBackendSync();

