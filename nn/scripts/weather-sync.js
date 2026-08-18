const fs = require('fs'); 
const path = require('path'); 

async function runBackendSync() { 
  try { 
    // 1. Target your exact iNaturalist Project ID directly
    // CHANGE THIS text string to match your exact iNat project slug or number ID
    const projectId = "304098"; 
    const api_url = 'https://api.inaturalist.org/v1/observations' + projectId + '&per_page=50';
    
    console.log('Fetching raw iNat observations from: ' + api_url); 

    // Pure, native Node fetch command - no browser helper dependencies
    const inatResponse = await fetch(api_url);
    if (!inatResponse.ok) {
      throw new Error(`iNaturalist API rejected request with status: ${inatResponse.status}`);
    }
    const obs_data = await inatResponse.json(); 

    // Filter out observations missing coordinates
    const validObs = obs_data.results.filter(obs => obs.geojson && obs.geojson.coordinates); 
    if (validObs.length === 0) { 
      console.log("No observations found with valid coordinates."); 
      return; 
    } 

    // 2. Map coordinates and prepare tracking arrays
    const lats = []; 
    const lons = []; 
    const referenceMap = []; 

    validObs.forEach((obs) => { 
      const [lon, lat] = obs.geojson.coordinates; 
      lats.push(lat); 
      lons.push(lon); 
      
      referenceMap.push({ 
        obsId: obs.id, 
        date: obs.observed_on_details?.date || obs.created_at.split('T')[0], 
        lat, 
        lon 
      }); 
    }); 

    // Establish your global start and end date tracking boundaries
    const dates = referenceMap.map(r => new Date(r.date)); 
    const minDate = new Date(Math.min(...dates)).toISOString().split('T')[0]; 
    const maxDate = new Date(Math.max(...dates)).toISOString().split('T')[0]; 

    // 3. Assemble un-scrubbable Open-Meteo archive parameters
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

    console.log(`Querying Open-Meteo for timeline window: ${minDate} to ${maxDate}`); 
    const meteoResponse = await fetch(meteoUrl); 
    
    if (!meteoResponse.ok) {
      throw new Error(`Open-Meteo server rejected parameters with status: ${meteoResponse.status}`);
    }
    
    const meteoData = await meteoResponse.json(); 
    console.log('Weather data download complete.'); 

    // 4. Cleanly map nested weather arrays back to table indices
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

    console.log("Successfully paired data array profiles. Processing write step..."); 

    // 5. Secure file output mapping relative to script folder pathing
    const outputDirectory = path.join(__dirname, '../data'); 
    if (!fs.existsSync(outputDirectory)) { 
      fs.mkdirSync(outputDirectory); 
    } 

    const filePath = path.join(outputDirectory, 'weather-cache.json'); 
    fs.writeFileSync(filePath, JSON.stringify(finalReport, null, 2)); 
    console.log("SUCCESS: Automated weather-cache.json has been written to disk."); 

    return finalReport;

  } catch (error) { 
    console.error("Workflow collection failed:", error.message); 
    process.exit(1); 
  } 
} 

runBackendSync();


