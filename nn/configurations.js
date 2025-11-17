async function asyncGetConfigurations() {
   console.log('json ' + json_root+p_params);
   await fetch((json_root+p_params+'.json'))
     .then(response => response.json())
     .then(data => {
      // Access your data here 
      for( let i=0; i<data.configurations.length; i++ ) {
           if( data.configurations[i].insect_project === p_project_id ) {
               interactions = data.configurations[i].interactions;
           }
           if( data.configurations[i].art_project === p_project_id ) {
               configuration = data.configurations[i];
           }
      }
      console.log(data);
   })
     .catch(error => {
      console.error('Error fetching JSON:', error);
   });
}

// need to pull resources from a json file to pass into an api
// so needs to be asynchronous. 
const getConfigurations = async () => {
   asyncGetConfigurations();
}

