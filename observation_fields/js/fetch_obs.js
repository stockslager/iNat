// A simple function to create a delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms)); 
 
async function fetchObs(url, customUserAgent) {
  // Iidentifying application with a custom User-Agent
  const headers = customUserAgent ? { 'User-Agent': customUserAgent } : {};
  
  try {
    const response = await fetch(url, { headers });
    
    // If "Too Many Requests" error, wait and retry.
    if (response.status === 429) {
      console.warn('Received HTTP 429 (Too Many Requests). Waiting 60 seconds before retrying.');
      await delay(60000); // Wait 60 seconds
      return fetchObs(url, customUserAgent); // Retry the request
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
    progressText.textContent = `${Math.round(percentage)}% Complete (${completed}/${total} requests)`;
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
async function getAllObservations( customUserAgent, obs_data ) {
  let total_results = '';
  let completedRequests = 0;

  if( winurlsearchstr==='' || p_query === '' || p_ofv_datatype === '' ) {
      return;
  } else {
      buildProgressBar();
  }

  console.log('Starting API calls...');
  console.log('Fetching a total of ' + obs_data.max_pages + ' pages...');

  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  let statusElem = document.getElementById('status');

  statusElem.textContent = "Status: Fetching in progress...";  let isFetching = false;
 
  for (let page = 1; page <= obs_data.max_pages; page++) {
    let pg = '&per_page='+obs_data.per_page+'&page='+page;
    const apiurl  = apibase+obs_data.api_params+pg;

    console.log('apiurl ' + apiurl );
    console.log('Fetching page ' + page + ' of ' + obs_data.max_pages + '...');
    
    try {
      // Apply a delay before all but the first request to stay within the rate limit.
      // iNaturalist recommends about 1 request per second.
      if( page > 1 ) { await delay(1000); console.log('delay '+page);}

      fetch(apiurl, customerUserAgent)
        .then((response) => {
           if( !response.ok ) { throw new Error(response.status+' ('+response.statusText+') returned from '+response.url); };
               return response.json();    
        })
        .then((data) => {
           total_results     = data.total_results;
           let calc_page_max = Math.ceil(total_results/obs_data.per_page);

           if( page === 1 && calc_page_max <= obs_data.max_pages ) {
               obs_data.max_pages = calc_page_max;
           }

           if( total_results === 0 ) {
               let message = '<br>No results found for query.' + 
                             '<br>No observations were found for the observation field datatype(s) and query specified.... ' + 
                             '<br><br>Query: ' + p_query + 
                             '<br>Observation Field Datatypes: ' + p_ofv_datatype + 
                             '<br><br>Please adjust the parameters such that observations are found.  ' + furl(window.location.pathname, 'return');
               throw( new Error(message) );
           }

           if( total_results >= obs_data.max_rows ) {
               let message = '<br>Total results returned from query is greater than the maximum allowed of ' + obs_data.max_rows + '.' + 
                             '<br>The project_id, user_id and other parameters resulted in results that exceed the maximum allowed.  ' +
                             '<br>Please add additional parameters that further reduce the number of results to be returned.  ' + furl(window.location.pathname, 'return');
               throw( new Error(message) );
           }

           completedRequests++;
           updateProgress(completedRequests, obs_data.max_pages);

           for( let i=0; i<data.results.length; i++ ) {
                const obs = new Observation( data.results[i] );
                obs_data.observations.push( obs );
           }
         
        })
        .catch((err) => {
           console.error(err.message);
           throw err;
        });
          
    } catch (error) {
      throw error;
    }
  }

// Function to fetch multiple pages of observations sequentially
/*async function getAllObservations( customUserAgent, obs_data ) {
  let total_results = '';
  let completedRequests = 0;

  if( winurlsearchstr==='' || p_query === '' || p_ofv_datatype === '' ) {
      return;
  } else {
      buildProgressBar();
  }

  console.log('Starting API calls...');
  console.log('Fetching a total of ' + obs_data.max_pages + ' pages...');

  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  let statusElem = document.getElementById('status');

  statusElem.textContent = "Status: Fetching in progress...";  let isFetching = false;
 
  for (let page = 1; page <= obs_data.max_pages; page++) {
    let pg = '&per_page='+obs_data.per_page+'&page='+page;
    const apiurl  = apibase+obs_data.api_params+pg;

    console.log('apiurl ' + apiurl );
    console.log('Fetching page ' + page + ' of ' + obs_data.max_pages + '...');
    
    try {
      // Apply a delay before all but the first request to stay within the rate limit.
      // iNaturalist recommends about 1 request per second.
      if( page > 1 ) { await delay(1000); console.log('delay '+page);}
     
      const data = await fetchObs(apiurl, customUserAgent);
     
      total_results     = data.total_results;
      let calc_page_max = Math.ceil(total_results/obs_data.per_page);

      if( page === 1 && calc_page_max <= obs_data.max_pages ) {
          obs_data.max_pages = calc_page_max;
      }

      if( total_results === 0 ) {
          let message = '<br>No results found for query.' + 
                        '<br>No observations were found for the observation field datatype(s) and query specified.... ' + 
                        '<br><br>Query: ' + p_query + 
                        '<br>Observation Field Datatypes: ' + p_ofv_datatype + 
                        '<br><br>Please adjust the parameters such that observations are found.  ' + furl(window.location.pathname, 'return');
          throw( new Error(message) );
      }

      if( total_results >= obs_data.max_rows ) {
          let message = '<br>Total results returned from query is greater than the maximum allowed of ' + obs_data.max_rows + '.' + 
                        '<br>The project_id, user_id and other parameters resulted in results that exceed the maximum allowed.  ' +
                        '<br>Please add additional parameters that further reduce the number of results to be returned.  ' + furl(window.location.pathname, 'return');
          throw( new Error(message) );
      }

      completedRequests++;
      updateProgress(completedRequests, obs_data.max_pages);

      for( let i=0; i<data.results.length; i++ ) {
           const obs = new Observation( data.results[i] );
           obs_data.observations.push( obs );
      }
    } catch (error) {
      throw error;
    }
  }*/
 
  // hide the progress bar once the fetching has completed successfully.
  hideProgressBar();

  if( total_results > 0 ) {
      obs_data.total_results = total_results;
      const jsonObj = JSON.stringify( obs_data );
      sessionStorage.setItem( cache_name, jsonObj );
  }

  return obs_data;
}

async function getAll(obs_data) {

   return (async () => {
    
      try {
       
         const customUserAgent = 'ObsFieldViewer/0.1 (@stockslager)'; 
         await getAllObservations( customUserAgent, obs_data );
       
      } catch (error) {
         throw error;
      }
    
   })();
  
};
