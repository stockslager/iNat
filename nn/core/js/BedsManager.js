/**
 * Represents a single beds entry.
 */
class Beds {
    constructor(data) {
        this.bedName  = data.bed_name;
        this.image    = data.image;
        this.taxonIds = data.taxon_ids;
    }
}

/**
 * Represents an item within the main 'configurations' array.
 */
class ConfigurationItem {
    constructor(configData) {
        // Use the nullish coalescing operator (??) to ensure properties are never undefined
        this.component = configData.component ?? null;
        this.project = configData.project ?? null;
        this.userId = configData.user_id ?? null; // Should now consistently show the ID or null
        this.title = configData.title ?? null;

        // Ensure hideOnAny results in a boolean or default to true
        this.hideOnAny = (configData.hide_on_any === 'yes') ?? true; 

        this.plantIds         = configData.plant_ids ?? null;
        this.activityTaxonIds = configData.activity_taxon_ids ?? null;
        this.usePlantProjectImages = configData.use_plant_project_images ?? null;

        this.studyTitle = configData.study_title ?? null;
        this.studyDesc  = configData.study_desc ?? null;

        this.beds   = configData.beds?.map(t => new Beds(t)) ?? [];
        
        // store the orginial .json with original field names that haven't been mapped to this object.
        this.originalConfig = configData ?? null;  // used in about.html to pretty print the original .json

        // Validation: Change from throwing errors to logging warnings and using defaults
        const isNullOrEmpty = (value) => value === null || typeof value !== 'string' || value.trim().length === 0;

        if (isNullOrEmpty(this.component)) {
            console.warn('Component is missing for an entry. Defaulting.');
            this.component = 'default-component'; // Provide a safe default
        }
    }

    getSubTitle() {
        if( this.studyTitle === null ) {
            return( '' );
        } else {
            return this.studyTitle;
        }
    }

    getFullTitle() {
        return `${this.title} (${this.component})`;
    }

}


/**
 * Main class to manage the entire configuration structure. (No filtering of items now)
 */
class ConfigManager {
    constructor(jsonData) {
        // No try-catch needed here anymore, as ConfigurationItem doesn't throw errors
        this.configurations = jsonData.configurations.map(config => {
            // All items are processed and kept in the array, even if data is partial
            return new ConfigurationItem(config);
        });

        // map the default_sub_icons if they're set
        this.plantIds         = jsonData.plant_ids;
        this.activityTaxonIds = jsonData.activity_taxon_ids;
        this.usePlantProjectImages = jsonData.use_plant_project_images;
    }

    getConfigByComponent(componentName) {
        return this.configurations.find(config => config.component === componentName);
    }

    getConfigByComponentAndStudyTitle(componentName, studyTitle) {
        return this.configurations.find(config => (config.component === componentName && config.studyTitle === studyTitle));
    }
}

// Function handles caching of the RAW data string for consistency
async function asyncGetConfiguration( params, component, studyTitle=null ) {

   const storageKey   = ('nn_configCache_'+params);
   const cachedDataString = sessionStorage.getItem(storageKey); 
   
   let managerInstance;
   let finalConfigInstance;

   // --- Check the cache first ---
   if( cachedDataString ) {
       try {
          const rawData = JSON.parse(cachedDataString); 
          console.log('Returning configuration from cache: ' + storageKey);
          
          managerInstance = new ConfigManager(rawData); // Process raw data into classes

          if( studyTitle ) {
              finalConfigInstance = component 
                                ? managerInstance.getConfigByComponentAndStudyTitle(component, studyTitle) 
                                : managerInstance;

          } else {
              finalConfigInstance = component 
                                ? managerInstance.getConfigByComponent(component) 
                                : managerInstance;
          }
          
          if( finalConfigInstance ) {
              if( !finalConfigInstance.plantIds ) {
                  if( managerInstance.plantIds ) { finalConfigInstance.plantIds = managerInstance.plantIds; }
              }
              if( !finalConfigInstance.activityTaxonIds ) {
                  if( managerInstance.activityTaxonIds ) { finalConfigInstance.activityTaxonIds = managerInstance.activityTaxonIds; }
              }
              if( !finalConfigInstance.usePlantProjectImages ) {
                  if( managerInstance.usePlantProjectImages ) { finalConfigInstance.usePlantProjectImages = managerInstance.usePlantProjectImages; }
              }
              
              return finalConfigInstance; 
          } else {
              throw new Error(`Requested component "${component}" not found in cache.`);
          }

       } catch (e) {
          console.error("Error processing cached configuration, fetching new data:", e.message);
          sessionStorage.removeItem(storageKey); 
       }
   }  
    
   // --- Fetch New Data ---
   if( !params ) {
       throw new Error(`Name of .json file must be specified in the URL/params.`);
   }

      try {
        const response = await fetch(params + '.json');
          
        // ... error handling for response (e.g. 500 Internal Server Error)...
        if( !response.ok ) {
            if( response.status === 404 ) {
                console.error('Resource not found (404):', params + '.json');
                throw new Error('Resource not found (404): ' + params + '.json');
            }
            console.error(`HTTP error! Status: ${response.status}`);
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json(); // The raw data object

        // Store the *raw JSON string* in the cache immediately
        sessionStorage.setItem(storageKey, JSON.stringify(data));

        // Process the raw data using your classes
        managerInstance = new ConfigManager(data);

          if( studyTitle ) {
              finalConfigInstance = component 
                                ? managerInstance.getConfigByComponentAndStudyTitle(component, studyTitle) 
                                : managerInstance;

          } else {
            finalConfigInstance = component 
                            ? managerInstance.getConfigByComponent(component) 
                            : managerInstance;
          }

        if( !finalConfigInstance.plantIds ) {
            if( managerInstance.plantIds ) { finalConfigInstance.plantIds = managerInstance.plantIds; }
        }
        if( !finalConfigInstance.activityTaxonIds ) {
            if( managerInstance.activityTaxonIds ) { finalConfigInstance.activityTaxonIds = managerInstance.activityTaxonIds; }
        }
        if( !finalConfigInstance.usePlantProjectImages ) {
            if( managerInstance.usePlantProjectImages ) { finalConfigInstance.usePlantProjectImages = managerInstance.usePlantProjectImages; }
        }
      
        return finalConfigInstance; 

   } catch (error) {
      console.error('Fatal Error during configuration fetch:', error.message);
      throw error; 
   }
}
