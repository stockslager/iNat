// Fetches data from a URL and parses it as JSON.
// Throws an error for non-OK HTTP statuses or network issues.
// @param {string} url The URL to fetch.
// @returns {Promise<object>} A promise that resolves to the JSON data.
async function apiFetch(url) {
    try {
        const response = await fetch(url);

        if (!response.ok) {
            // This error will be caught by the local catch block or the caller's catch
            throw new Error(`${response.status} (${response.statusText}) returned from ${response.url}`);
        }

        // This can also throw an error if the data is not valid JSON
        const data = await response.json(); 
        
        return data; // Implicitly returns a resolved Promise with the data

    } catch (err) {
        console.error("Fetch error:", err.message);
        // Re-throw the error so the calling code must also handle it
        throw err; 
    }
}
