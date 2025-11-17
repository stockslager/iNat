// find the taxon name given the taxon_id in the list of sub_icons in the configuration
function getShowMenuName( config_data, taxon_id ) {
    let show_menu_name = '';

    // hard coding for plants since it's not shown on the main activity.
    // need to revisit.
    if( taxon_id.toString() === '47126' ) {
        return 'plants';
    }

    if( config_data.sub_icons ) {
        for( let i=0; i<config_data.sub_icons.length; i++) {
             if( config_data.sub_icons[i].taxon_id.toString() === taxon_id.toString() ) {
                 show_menu_name = config_data.sub_icons[i].nm;
                 break;
             }
        }
    }

    if( !show_menu_name ) { console.log('Show Menu Name Not Found'); }
    
    return show_menu_name;
}

function findConfiguration( config_data, params, project_id ) {
    let configuration = '';
   
    // check for null, or zero configurations
    if( !config_data.configurations || config_data.configurations.length === 0 ) {
        let message = 'Configuration file ('+params+'.json) contains no valid configurations.' + 
                      '<br>There are no configurations specified in '+params+'.json' + 
                      '<br>Please add at least one valid configuration to '+params+'.json';
        throw new Error(message);
    }

    for( let i=0; i<config_data.configurations.length; i++ ) {
         if( config_data.configurations[i].insect_project === project_id ) {
             configuration = config_data.configurations[i];
         }
    }

    if( !project_id ) {
        let message = 'A project parameter is required.' + 
                      '<br>There is no project parameter in the url to be matched with a configuration in '+params+'.json' + 
                      '<br>Please add a valid project parameter to the url.';
        throw new Error(message);
    }

    if( !configuration ) {
        let message = 'Configuration not found.' + 
                      '<br>A configuration with a matching project ('+project_id+') does not exist in '+params+'.json.' + 
                      '<br>Please verify the project ('+project_id+') in the url and make sure it exists in '+params+'.json.';
        throw new Error(message);
    }

    return configuration;
}

// function to handle fetching / caching of configurations
async function asyncGetConfiguration( params, project_id ) {

   const storageKey = ('nn_configCache_'+params);
   const cachedData = sessionStorage.getItem(storageKey);

   // --- Check the cache first ---
   if( cachedData ) {
       console.log('Returning configuration from cache: ' + storageKey);
       try {
          const data = JSON.parse(cachedData);
          return findConfiguration(data, params, project_id);
       } catch (e) {
          console.error("Error parsing cached JSON, fetching new data.");
          sessionStorage.removeItem(storageKey); // Clear bad cache entry
       }
   }  
    
   console.log('fetching json: ' + json_root + params);

   if( !params ) {
       let message = 'Name of .json must be specified in the url.' + 
                     '<br>There are no params in the url to be matched with a .json configuration file.' + 
                     '<br>Please add the name of a valid .json file to the url.';
       throw new Error(message);
   }

   try {
      const response = await fetch(json_root + params + '.json');

      if( !response.ok ) {
          if( response.status === 404 ) {
              let message = 'Name of .json must be specified in the url.' + 
                            '<br>A parameters file named '+params+' has no matching .json configuration file.' + 
                            '<br>Please add the name of a valid .json file to the url.';
              throw new Error(message);
          }
          throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Store data in session storage before returning 
      // sessionStorage only stores strings, so we must use JSON.stringify
      sessionStorage.setItem(storageKey, JSON.stringify(data));
      console.log('Stored configuration in session storage: ' + storageKey);
            
      // Return the data object when successful
      return ( findConfiguration(data, params, project_id) ); 

   } catch (error) {
      console.error('Error fetching JSON:', error);
      
      // Re-throw the error so the caller can catch it and handle it
      throw error; 
   }
}

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
