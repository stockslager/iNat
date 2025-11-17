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

async function asyncGetConfiguration( params, project_id ) {
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
                            '<br>A parameters file named '+params+'has no matching .json configuration file.' + 
                            '<br>Please add the name of a valid .json file to the url.';
              throw new Error(message);
          }
          throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
            
      // Return the data object when successful
      return ( findConfiguration(data, params, project_id) ); 

   } catch (error) {
      console.error('Error fetching JSON:', error);
      
      // Re-throw the error so the caller can catch it and handle it
      throw error; 
   }
}

// need to pull resources from a json file to pass into an api
// so needs to be asynchronous. 
const getConfigurations = async () => {
   asyncGetConfigurations();
}

