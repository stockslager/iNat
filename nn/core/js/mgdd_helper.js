// Keep the downloaded weather cache in memory so we only fetch it ONCE
let localWeatherCacheMap = null;

/**
 * Downloads the cloud weather cache file and prepares it for instant lookup.
 * Call this once at the very top of your page load script.
 */
async function initializeMgddHelper() {
  try {
    const response = await fetch('../data/weather-cache.json');
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
  // STANDARD 86/50 MODIFIED GROWING DEGREE DAY LOGIC
  // ==========================================
  const BASE_LOW = 50;   // Threshold below which growth/activity ceases
  const CAP_HIGH = 86;   // Cutoff above which growth potential plateaus

  // Extract raw weather records from the JSON payload
  let actualHigh = weatherRecord.tmax;
  let actualLow = weatherRecord.tmin;

  // Apply the "Modified" clipping caps safely
  let modifiedHigh = actualHigh > CAP_HIGH ? CAP_HIGH : actualHigh;
  let modifiedLow = actualLow < BASE_LOW ? BASE_LOW : actualLow;

  // Compute the daily average from the modified values
  let dailyAverage = (modifiedHigh + modifiedLow) / 2;

  // Subtract the baseline threshold to calculate heat accumulation
  let calculatedMgdd = dailyAverage - BASE_LOW;

  // Final fallback guard (safeguard against negative degree values)
  if (calculatedMgdd < 0) {
    calculatedMgdd = 0;
  }

  // Return the clean score rounded to one decimal point
  return Number(calculatedMgdd.toFixed(1));
}
