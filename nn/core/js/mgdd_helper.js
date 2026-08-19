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

