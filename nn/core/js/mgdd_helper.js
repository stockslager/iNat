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
    
    localWeatherCacheMap = new Map();
    weatherDataArray.forEach(record => {
      localWeatherCacheMap.set(String(record.obsId), record);
    });
    console.log("MGDD Helper initialized successfully with data rows.");
  } catch (error) {
    console.error("Failed to initialize MGDD weather cache mapping:", error);
    localWeatherCacheMap = new Map();
  }
}

/**
 * Takes an iNaturalist Observation ID, looks up its pre-calculated weather total,
 * and returns it directly.
 */
function getMgddForObservationId(obsId) {
  if (!localWeatherCacheMap) {
    console.warn("MGDD Helper requested before initialization was complete.");
    return "Loading...";
  }

  const weatherRecord = localWeatherCacheMap.get(String(obsId));

  if (!weatherRecord || weatherRecord.mgdd === undefined || weatherRecord.mgdd === null) {
    return "Coming Soon";
  }

  return weatherRecord.mgdd;
}

/**
 * Dynamically fetches weather data for a single row and displays the
 * complete calculation history inside a custom, scrollable on-screen popup.
 */
async function showMgddBreakdownModal(lat, lon, obsDate) {
  try {
    const obsYear = String(obsDate).slice(0, 4);
    const startDate = obsYear + "-02-01";
    const cleanEndDate = String(obsDate).slice(0, 10);

    const baseDomain = "https://archive-api.open-meteo.com/v1/archive";
    const url = baseDomain + "?latitude=" + lat + "&longitude=" + lon + "&start_date=" + startDate + "&end_date=" + cleanEndDate + "&daily=temperature_2m_max,temperature_2m_min" + "&temperature_unit=fahrenheit" + "&timezone=EST";

    const loadingNotice = document.createElement('div');
    loadingNotice.id = 'mgdd-loading-overlay';
    loadingNotice.style = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);color:white;display:flex;justify-content:center;align-items:center;z-index:10000;font-family:sans-serif;font-size:20px;";
    loadingNotice.innerText = "Fetching daily weather data from Open-Meteo...";
    document.body.appendChild(loadingNotice);

    const response = await fetch(url);
    document.body.removeChild(loadingNotice);
    
    if (!response.ok) throw new Error("API call failed");
    const data = await response.json();
    const daily = data?.daily;

    if (!daily || !daily.time) {
      alert("No data returned from weather service.");
      return;
    }

    let cumulativeMgdd = 0;
    let tableRowsHtml = "";

    var targetDateStr = String(obsDate).slice(0, 10);
    var startStr = obsYear + "-02-01";
    
    for (let d = 0; d < daily.time.length; d++) {
      const currentTimeStr = daily.time[d];
      const currentTimestamp = Date.parse(currentTimeStr);

      if (currentTimeStr < startStr) continue;
      if (currentTimeStr > targetDateStr) break;

      const tmax = daily.temperature_2m_max ? daily.temperature_2m_max[d] : null;
      const tmin = daily.temperature_2m_min ? daily.temperature_2m_min[d] : null;

      let dailyGdd = 0;

      if (tmax !== null && tmin !== null) {
        const adjustedMax = Math.max(50, Math.min(86, tmax));
        const adjustedMin = Math.max(50, Math.min(86, tmin));
        const rawGdd = ((adjustedMax + adjustedMin) / 2) - 50;
        if (rawGdd > 0) {
          dailyGdd = rawGdd;
          cumulativeMgdd += dailyGdd;
        }
      }

      var currentRunningRound = Math.round(cumulativeMgdd);

      tableRowsHtml += '<tr style="border-bottom:1px solid #ddd;">' +
        '<td style="padding:8px;text-align:left;">' + currentTimeStr + '</td>' +
        '<td style="padding:8px;text-align:center;">' + (tmax !== null ? tmax + "°F" : "N/A") + '</td>' +
        '<td style="padding:8px;text-align:center;">' + (tmin !== null ? tmin + "°F" : "N/A") + '</td>' +
        '<td style="padding:8px;text-align:center;color:#2ecc71;font-weight:bold;">+' + dailyGdd.toFixed(1) + '</td>' +
        '<td style="padding:8px;text-align:right;font-weight:bold;">' + currentRunningRound + '</td>' +
      '</tr>';
    }

    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'mgdd-modal-overlay';
    modalOverlay.style = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;justify-content:center;align-items:center;z-index:9999;font-family:sans-serif;";

    // FIXED: Changed ${Math.round(runningTotal)} to ${Math.round(cumulativeMgdd)} at the bottom summary container card layout block
    modalOverlay.innerHTML = `
      <div style="background:white;width:90%;max-width:650px;height:80%;max-height:600px;border-radius:8px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,0.3);">
        <div style="background:#2c3e50;color:white;padding:15px;display:flex;justify-content:space-between;align-items:center;">
          <h3 style="margin:0;font-size:18px;">Calculation History (Lat: ${lat}, Lon: ${lon})</h3>
          <button onclick="document.body.removeChild(document.getElementById('mgdd-modal-overlay'))" style="background:none;border:none;color:white;font-size:24px;cursor:pointer;line-height:1;">&times;</button>
        </div>
        <div style="flex:1;overflow-y:auto;padding:15px;">
          <p style="margin-top:0;color:#7f8c8d;font-size:14px;">Accumulation window starts on February 1st, ${obsYear} and terminates on your observation date (${cleanEndDate}). Baseline threshold is set to 50°F, upper limit cap is 86°F.</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <thead>
              <tr style="background:#f2f2f2;border-bottom:2px solid #ccc;">
                <th style="padding:8px;text-align:left;">Date</th>
                <th style="padding:8px;text-align:center;">Max Temp</th>
                <th style="padding:8px;text-align:center;">Min Temp</th>
                <th style="padding:8px;text-align:center;">GDD Added</th>
                <th style="padding:8px;text-align:right;">Running Total</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
          </table>
        </div>
        <div style="background:#f9f9f9;padding:15px;text-align:right;border-top:1px solid #eee;font-weight:bold;font-size:16px;">
          Final Pre-Calculated Score: <span style="color:#2980b9;font-size:20px;">${Math.round(cumulativeMgdd)} MGDD</span>
        </div>
      </div>
    `;

    document.body.appendChild(modalOverlay);

  } catch (error) {
    console.error("Popup generation processing engine failed:", error);
    alert("Could not load calculation breakdown history window.");
  }
}

