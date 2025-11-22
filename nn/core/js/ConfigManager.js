const CONST_CONFIGS_OBJ_PLANTS = 'plants';
const CONST_CONFIGS_OBJ_HIKER  = 'hiker';
const CONST_CONFIGS_OBJ_YARD   = 'yard';
const CONST_CONFIGS_OBJ_ART    = 'art';

/**
 * Represents a single taxon entry (e.g., American Asters).
 */
class Taxon {
    /**
     * @param {object} data - The taxon data object.
     * @param {string} data.taxon_id
     * @param {string} data.taxon_name
     */
    constructor(data) {
        this.taxonId = data.taxon_id;
        this.taxonName = data.taxon_name;
    }
}

/**
 * Represents a sub-icon entry.
 */
class SubIcon {
    /**
     * @param {object} data - The sub-icon data object.
     * @param {string} data.nm - Name/label (e.g., 'plants')
     * @param {string} data.taxon_id
     * @param {string} data.icon - The emoji icon character
     */
    constructor(data) {
        this.name = data.nm;
        this.taxonId = data.taxon_id;
        this.icon = data.icon;
    }
}

/**
 * Represents an item within the main 'configurations' array.
 */
class ConfigurationItem {
    /**
     * @param {object} configData - The configuration data object.
     */
    constructor(configData) {
        this.component = configData.component;
        this.project = configData.project ?? null;
        this.insectProject = configData.insect_project ?? null;
        this.plantProject = configData.plant_project ?? null;
        this.seedProject = configData.seed_project ?? null;
        this.userId = configData.user_id ?? null;
        this.title = configData.title ?? null;
        this.hideOnAny = (configData.hide_on_any === 'yes') ?? false; // Convert string "yes" to boolean
        this.plantFilter = configData.plant_filter ?? null;
        this.plantFilterValue = configData.plant_filter_value ?? null;
        this.defaultPlace = configData.default_place ?? null;
        this.fieldId = configData.field_id ?? null;
        this.fieldName = configData.field_name ?? null;
        this.fieldValue = configData.field_value ?? null;
        
        // Map nested arrays to their respective classes
        this.taxa = configData.taxa?.map(t => new Taxon(t)) ?? [];
        this.subIcons = configData.sub_icons?.map(s => new SubIcon(s)) ?? [];

        // --- type/presence validation ---
        // --- Validations (if kept) ---
        // Your validation logic must now check for 'null' instead of just undefined/empty string
        const isNullOrEmpty = (value) => value === null || typeof value !== 'string' || value.trim().length === 0;

        if (isNullOrEmpty(this.component)) {
            // Log a warning or handle as needed, but do not throw an error to keep the item in the list
            console.warn('Component is missing for an entry.');
        }

        // component is plants but "project" and/or "insect_project" is not set.
        /*if( configData.component === CONST_CONFIGS_OBJ_PLANTS ) {
            if( configData.project.trim().length === 0 || configData.insect_project.trim().length === 0 )  {
                throw new Error('Configuration Item requires valid non-empty "project" and "insect_project" attributes.');
            } 
        }*/
        // component is hiker but "project" is not set.
   /*     if( configData.component === CONST_CONFIGS_OBJ_HIKER ) {
            if( configData.project.trim().length === 0 ) {
                throw new Error('Configuration Item requires a valid non-empty "project".');
            }
        }
        // component is art but "project" is not set.
        if( configData.component === CONST_CONFIGS_OBJ_ART ) {
            if( configData.project.trim().length === 0 ) {
                throw new Error('Configuration Item requires a valid non-empty "project".');
            }
        } */
    }

    /**
     * Example method: Get a descriptive title.
     * @returns {string}
     */
    getFullTitle() {
        return `${this.title} (${this.component})`;
    }
}

/**
 * Main class to manage the entire configuration structure.
 * @param {object} jsonData - The raw JSON object imported into JavaScript.
 */
class ConfigManager {
    constructor(jsonData) {
        this.configurations = jsonData.configurations.map(config => {
            try {
                return new ConfigurationItem(config);
            } catch (error) {
                // Log the specific validation error message, but continue execution
                console.error(`Skipping invalid configuration entry: ${error.message}`);
                // Return null so we can filter this invalid entry out later
                return null; 
            }
        }).filter(item => item !== null); // Filter out all the 'null' entries

        // Map the default_sub_icons array to SubIcon instances
        if( jsonData.default_sub_icons ) {
            this.defaultSubIcons = jsonData.default_sub_icons.map(iconData => new SubIcon(iconData));
        }
    }

    /**
     * Find a specific configuration by component name.
     * @param {string} componentName 
     * @returns {ConfigurationItem | undefined}
     */
    getConfigByComponent(componentName) {
        return this.configurations.find(config => config.component === componentName);
    }
}

// function to handle fetching / caching of configurations
// returns one configuration if component name is passed in (component is optional)
// otherwise returns all configurations (via the manager object).
async function asyncGetConfiguration( params, component ) {

   const storageKey   = ('nn_configCache_'+params);
   const cachedData   = sessionStorage.getItem(storageKey);
   
   let finalConfigInstance;

   // --- Check the cache first ---
   if( cachedData ) {
       try {
          const rawData = JSON.parse(cachedData);
          const managerInstance = new ConfigManager(rawData);

           console.log('raw ' + JSON.stringify(rawData));
           console.log('mgr ' + JSON.stringify(managerInstance));
console.log('mgr (snapshot): ' + JSON.stringify(managerInstance));

// OR log a deep copy
console.log('mgr (deep copy):', JSON.parse(JSON.stringify(managerInstance)));
           
          finalConfigInstance = component 
                                ? managerInstance.getConfigByComponent(component) 
                                : managerInstance;
          
          if (finalConfigInstance) {
              return finalConfigInstance; 
          } else {
              // If we requested a specific component that wasn't found (maybe it was skipped/invalid)
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
      if( !response.ok ) {
          // Handles network-level errors cleanly
          throw new Error(`HTTP error! status: ${response.status} when fetching ${params}.json`);
      }

      const data = await response.json();
       
      const manager = new ConfigManager(data);

      sessionStorage.setItem(storageKey, JSON.stringify(manager));
      console.log('Stored configuration in session storage: ' + storageKey);

      finalConfigInstance = component 
                            ? manager.getConfigByComponent(component) 
                            : manager;
      
      return finalConfigInstance;  

   } catch (error) {
      // This primarily catches Fetch errors or serious JSON parse errors
      console.error('Fatal Error during configuration fetch:', error.message);
      throw error; // Re-throw the network/fetch error
   }
}
