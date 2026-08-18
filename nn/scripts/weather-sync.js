const fs = require('fs'); 
const path = require('path'); 
const https = require('https'); 

// Native, vanilla Node helper to handle requests without using the modern 'fetch' variable
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
    }).on('error', (err) => { reject(err); });
  });
}

async function runBackendSync() { 
  try { 
    // 1. Target your exact iNaturalist Project ID
    const projectId = "?project_id=304098"; 
    const inatUrl = 'https://api.inaturalist.org/v1/observations' + projectId + '&per_page=50';
    
    console.log('Downloading observations from: ' + inatUrl); 
    const obs_data = await makeHttpRequest(inatUrl);

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
      lats.push(Number(lat).toFixed(2)); 
      lons.push(Number(lon).toFixed(2)); 
      
      referenceMap.push({ 
        obsId: obs.id, 
        date: obs.observed_on_details?.date || obs.created_at.split('T')[0], 
        lat: Number(lat).toFixed(2), 
        lon: Number(lon).toFixed(2)
      }); 
    }); 

    const dates = referenceMap.map(r => new Date(r.date)); 
    const minDate = new Date(Math.min(...dates)).toISOString().split('T')[0]; 
    const maxDate = new Date(Math.max(...dates)).toISOString().split('T')[0]; 

    // 3. Assemble parameters to connect to Open-Meteo
    const baseProtocol = "https://"; 
    const apiSubdomain = "archive-api"; 
    const apiDomain = "open-meteo"; 
    const apiTld = "com"; 
    const apiPath = "/v1/archive"; 
    const cleanMeteoUrl = baseProtocol + apiSubdomain + "." + apiDomain + "." + apiTld + apiPath;

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
    console.log(`Querying weather data between: ${minDate} and ${maxDate}`); 
    
    const meteoData = await makeHttpRequest(meteoUrl); 
    console.log('Weather data download complete.'); 

    // 4. Map nested weather arrays back to table indices
    const finalReport = referenceMap.map((obsMeta, index) => { 
      const weatherRecord = Array.isArray(meteoData) ? meteoData[index] : meteoData; 
      const dailyTimeline = weatherRecord?.daily; 

      if (!dailyTimeline || !dailyTimeline.time) { 
        return { obsId: obsMeta.obsId, date: obsMeta.date, coordinates: { lat: obsMeta.lat, lon: obsMeta.lon }, tmax: null, tmin: null }; 
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

    console.log("Successfully paired weather metrics with observations."); 

    // 5. Generate secure local file directory and save outputs
    const outputDirectory = path.join(__dirname, '../data'); 
    if (!fs.existsSync(outputDirectory)) { 
      fs.mkdirSync(outputDirectory, { recursive: true }); 
    } 

    const filePath = path.join(outputDirectory, 'weather-cache.json'); 
    fs.writeFileSync(filePath, JSON.stringify(finalReport, null, 2)); 
    console.log("SUCCESS: Automated weather-cache.json written to disk."); 

    return finalReport;

  } catch (error) { 
    console.error("Workflow collection failed:", error.message); 
    process.exit(1); 
  } 
} 

runBackendSync();
