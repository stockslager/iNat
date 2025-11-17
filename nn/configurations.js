async function asyncGetConfigurations(params) {
   console.log('fetching json: ' + json_root + params);

   try {
      const response = await fetch(json_root + params + '.json');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Access and manipulate global variables if necessary
      /*for( let i=0; i<data.configurations.length; i++ ) {
           if( data.configurations[i].insect_project === p_project_id ) {
               interactions = data.configurations[i].interactions;
           }
           if( data.configurations[i].art_project === p_project_id ) {
               configuration = data.configurations[i];
           }
      }*/
      
      // Return the data object when successful
      return data; 

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

