// A simple function to create a delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms)); 
 
// A reusable function for making rate-limited API calls
async function rateLimitedFetch(url, customUserAgent) {
  // Iidentifying application with a custom User-Agent
  const headers = customUserAgent ? { 'User-Agent': customUserAgent } : {};
  
  try {
    const response = await fetch(url, { headers });
    
    // If "Too Many Requests" error, wait and retry.
    if (response.status === 429) {
      console.warn('Received HTTP 429 (Too Many Requests). Waiting 60 seconds before retrying.');
      await delay(60000); // Wait 60 seconds
      return rateLimitedFetch(url, customUserAgent); // Retry the request
    }

    if( response.status === 422 ) {
          const errorBody = await response.json(); 
          const errorMessage = errorBody.errors?.[0]?.message || JSON.stringify(errorBody);
          let message = '<b>' + response.status + '</b>' + 
                        '<br><b>' + errorMessage.toLowerCase() + '</b>' +   
                        '<br>A parameter unknown to the system was specified in the query parameters. ' + 
                        '<br>Please adjust the parameter mentioned above. &nbsp;&nbsp;' + furl(window.location.pathname, 'return');
          throw new Error(message);
    }
    
    if (!response.ok) {
      throw new Error('API returned status code: ' + response.status );
    }

    // Apply a delay before the next request to stay within the rate limit.
    // iNaturalist recommends about 1 request per second.
    await delay(1000);
    
    return response.json();
    
  } catch (error) {
    console.error('An error occurred during the API call:', error);
    throw error;
  }
}

// Function to update the progress bar UI
function updateProgress(completed, total) {
    const percentage = (completed / total) * 100;
    progressBar.style.width = percentage + '%';
    progressBar.textContent = Math.round(percentage) + '%';
    progressText.textContent = `${Math.round(percentage)}% Complete (${completed}/${max_pages} requests)`;
}

function buildProgressBar() {
   let progress_bar = [ { innerHTML:'<div class="container" id="progress_div">' + 
                                    '<div class="progress-container">' + 
                                    '<div class="progress-bar" id="progressBar"></div>' +
                                    '</div>' + 
                                    '<p id="progressText">0% Complete (0/0 requests)</p>' + 
                                    '<p id="status">Status: Waiting to start...</p>' +
                                    '</div>' }, ];
   faddelems('p',document.body,progress_bar);
}
 
function hideProgressBar() {
   // Get the elements
   const progress_div    = document.getElementById('progress_div');

   // Hide the elements
   if( progress_div )    { progress_div.style.display     = 'none'; }
}

// Function to fetch multiple pages of observations sequentially
async function getAllObservations( max_pages, customUserAgent ) {
  const allObservations = [];
  let total_results = '';
  let api_params = '';
  let completedRequests = 0;

  if( winurlsearchstr==='' || p_query === '' || p_ofv_datatype === '' ) {
      return;
  } else {
      api_params = setParams();
      buildProgressBar();
  }

  console.log('Starting API calls...');
  console.log('Fetching a total of ' + max_pages + ' pages...');

  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  let statusElem = document.getElementById('status');

  statusElem.textContent = "Status: Fetching in progress...";  let isFetching = false;
 
  for (let page = 1; page <= max_pages; page++) {
    let pg = '&per_page='+per_page+'&page='+page;
    const apiurl  = apibase+api_params+pg;

    console.log('apiurl ' + apiurl );
    console.log('Fetching page ' + page + ' of ' + max_pages + '...');
    
    try {
      const data = await rateLimitedFetch(apiurl, customUserAgent);

      console.log('data... ' + data);
      total_results     = data.total_results;
      let calc_page_max = Math.ceil(total_results/per_page);

      if( page === 1 && calc_page_max <= max_pages ) {
          max_pages = calc_page_max;
      }

      if( total_results === 0 ) {
          let message = '<br>No results found for query.' + 
                        '<br>No observations were found for the observation field datatype(s) and query specified.... ' + 
                        '<br><br>Query: ' + p_query + 
                        '<br>Observation Field Datatypes: ' + p_ofv_datatype + 
                        '<br><br>Please adjust the parameters such that observations are found.  ' + furl(window.location.pathname, 'return');
          throw( new Error(message) );
      }
   
      if( total_results >= max_rows ) {
          let message = '<br>Total results returned from query is greater than the maximum allowed of ' + max_rows + '.' + 
                        '<br>The project_id, user_id and other parameters resulted in results that exceed the maximum allowed.  ' +
                        '<br>Please add additional parameters that further reduce the number of results to be returned.  ' + furl(window.location.pathname, 'return');
          throw( new Error(message) );
      }

      completedRequests++;
      updateProgress(completedRequests, max_pages);
    
      for( let i=0; i<data.results.length; i++ ) {
           const obs = new Observation( data.results[i] );
           allObservations.push( obs );
      }
    } catch (error) {
      throw error;
    }
  }

  const obs_data = new ObservationsData( allObservations, total_results );

  // hide the progress bar once the fetching has completed successfully.
  hideProgressBar();

  if( total_results > 0 ) {
      const jsonObj = JSON.stringify( obs_data );
      sessionStorage.setItem( cache_name, jsonObj );
  }

  return obs_data;
}

async function getAll() {

   return (async () => {
      try {
         const customUserAgent = 'ObsFieldViewer/0.1 (@stockslager)'; 
         let observations_data = '';

         const cache_str    = sessionStorage.getItem( cache_name );

         if( cache_str ) {
             observations_data = JSON.parse(cache_str); 
             console.log('found cached observations... ' );
             console.log('First observation:', observations_data.observations[0]);
         } else {
             observations_data = await getAllObservations( max_pages, customUserAgent );
         }
    
         // Process observations
         if( observations_data && observations_data.observations.length > 0 ) {
            console.log('Fetched a total of ' + observations_data.observations.length + ' observations.');
            console.log('First observation:', observations_data.observations[0]);
            fresults(observations_data);
         }
      } catch (error) {
         throw error;
      }
   })();
  
};
