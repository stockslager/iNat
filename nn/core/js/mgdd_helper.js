// Keep the downloaded weather cache in memory so we only fetch it ONCE
let localWeatherCacheMap = null;

/**
 * Downloads the cloud weather cache file and prepares it for instant lookup.
 * Call this once at the very top of your page load script.
 */
async function initializeMgddHelper() {
  try {
    // UPDATED: Adjust path if necessary depending on your HTML page depth layout
    const response = await fetch('../data/weather-cache.json');
    const weatherDataArray = await response.json();
    
    // Convert the flat array into a fast ID-indexed lookup map: { "obsId": { mgdd } }
    localWeatherCacheMap = new Map();
    weatherDataArray.forEach(record => {
      localWeatherCacheMap.set(String(record.obsId), record);
    });
    console.log("MGDD Helper initialized successfully with data rows.");
  } catch (error) {
    console.error("Failed to initialize MGDD weather cache mapping:", error);
    localWeatherCacheMap = new Map(); // Fallback to empty map to prevent crashes
  }
}

/**
 * Takes an iNaturalist Observation ID, looks up its pre-calculated weather total,
 * and returns it directly.
 * @param {string|number} obsId - The iNaturalist Observation ID
 * @returns {number|string} The cumulative MGDD value, or "N/A" if missing
 */
function getMgddForObservationId(obsId) {
  // Safety check: if initialize helper hasn't finished running yet
  if (!localWeatherCacheMap) {
    console.warn("MGDD Helper requested before initialization was complete.");
    return "Loading...";
  }

  // Look up the observation record instantly by its ID key
  const weatherRecord = localWeatherCacheMap.get(String(obsId));

  // If this ID doesn't exist in our weather file or mgdd calculation failed, return N/A safely
  if (!weatherRecord || weatherRecord.mgdd === undefined || weatherRecord.mgdd === null) {
    return "N/A";
  }

  // UPDATED: Return the pre-calculated cumulative integer directly from your clean database file
  return weatherRecord.mgdd;
}

/**
 * Dynamically fetches the daily weather history for a single clicked row 
 * and console.logs the calculation breakdown (or sends it to a popup).
 * @param {number|string} lat - Latitude of the observation
 * @param {number|string} lon - Longitude of the observation
 * @param {string} obsDate - The YYYY-MM-DD date of the observation
 */
async function getMgddBreakdownOnDemand(lat, lon, obsDate) {
  try {
    const obsYear = String(obsDate).slice(0, 4);
    const startDate = obsYear + "-02-01";
    const cleanEndDate = String(obsDate).slice(0, 10);

    console.log(`Fetching on-demand daily breakdown from Open-Meteo for range: ${startDate} to ${cleanEndDate}`);

    const mainDomain = "https://archive-api.open-meteo.com/v1/archive";

    const url = mainDomain + 
      "?latitude=" + lat + 
      "&longitude=" + lon + 
      "&start_date=" + startDate + 
      "&end_date=" + cleanEndDate + 
      "&daily=temperature_2m_max,temperature_2m_min" + 
      "&temperature_unit=fahrenheit" + 
      "&timezone=auto";
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Server returned status code: ${response.status}`);
    
    const data = await response.json();
    const daily = data?.daily;

    if (!daily || !daily.time) {
      console.warn("No daily timeline data returned from Open-Meteo for this point.");
      return null;
    }

    let runningTotal = 0;
    let breakdownLog = [];

    // Loop through the data day-by-day to reconstruct the calculations
    for (let d = 0; d < daily.time.length; d++) {
      const currentDate = daily.time[d];
      const tmax = daily.temperature_2m_max ? daily.temperature_2m_max[d] : null;
      const tmin = daily.temperature_2m_min ? daily.temperature_2m_min[d] : null;

      if (tmax !== null && tmin !== null) {
        const adjustedMax = Math.max(50, Math.min(86, tmax));
        const adjustedMin = Math.max(50, Math.min(86, tmin));
        const dailyGdd = ((adjustedMax + adjustedMin) / 2) - 50;
        
        if (dailyGdd > 0) {
          runningTotal += dailyGdd;
        }

        breakdownLog.push({
          date: currentDate,
          rawMax: tmax,
          rawMin: tmin,
          addedGdd: Number(dailyGdd.toFixed(1)),
          runningGdd: Math.round(runningTotal)
        });
      }
    }

    // Returns the complete daily breakdown array to your table click event listener
    return breakdownLog;

  } catch (error) {
    console.error("On-demand breakdown fetch failed:", error.message);
    return null;
  }
}
