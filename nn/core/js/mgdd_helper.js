// Keep the downloaded weather cache in memory so we only fetch it ONCE
let localWeatherCacheMap = null;

/**
 * Downloads the cloud weather cache file and prepares it for instant lookup.
 * Call this once at the very top of your page load script.
 */
async function initializeMgddHelper() {
  try {
    const response = await fetch('./nn/data/weather-cache.json');
    const weatherDataArray = await response.json();
    
    // Convert the flat array into a fast ID-indexed lookup map: { "obsId": {tmax, tmin} }
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
 * Takes an iNaturalist Observation ID, looks up its weather, 
 * calculates the MGDD value, and returns it.
 * @param {string|number} obsId - The iNaturalist Observation ID
 * @returns {number|string} The calculated MGDD value, or "N/A" if missing
 */
function getMgddForObservationId(obsId) {
  // Safety check: if initialize helper hasn't finished running yet
  if (!localWeatherCacheMap) {
    console.warn("MGDD Helper requested before initialization was complete.");
    return "Loading...";
  }

  // Look up the observation record instantly by its ID key
  const weatherRecord = localWeatherCacheMap.get(String(obsId));
  
  // If this ID doesn't exist in our weather file, return N/A safely
  if (!weatherRecord || weatherRecord.tmax === null || weatherRecord.tmin === null) {
    return "N/A";
  }

  const high = weatherRecord.tmax;
  const low = weatherRecord.tmin;

  // ==========================================
  // YOUR MGDD MATHEMATICS HERE
  // Adjust these baseline thresholds to match your study formulas
  // ==========================================
  const baselineThreshold = 50; 
  
  // Standard Growing Degree Day formula baseline calculation
  let calculatedMgdd = ((high + low) / 2) - baselineThreshold;
  
  // Degree days can never be negative (if it's freezing, development just stalls)
  if (calculatedMgdd < 0) {
    calculatedMgdd = 0;
  }

  // Return the final calculation rounded to 1 decimal place
  return Number(calculatedMgdd.toFixed(1));
}
