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
        this.project = configData.project;
        this.insectProject = configData.insect_project;
        this.plantProject = configData.plant_project;
        this.seedProject = configData.seed_project;
        this.userId = configData.user_id;
        this.title = configData.title;
        this.hideOnAny = configData.hide_on_any === 'yes'; // Convert string "yes" to boolean
        this.plantFilter = configData.plant_filter;
        this.plantFilterValue = configData.plant_filter_value;
        this.defaultPlace = configData.default_place;
        this.fieldId = configData.field_id;
        this.fieldName = configData.field_name;
        
        // Map nested arrays to their respective classes
        this.taxa = configData.taxa ? configData.taxa.map(t => new Taxon(t)) : [];
        this.subIcons = configData.sub_icons ? configData.sub_icons.map(s => new SubIcon(s)) : [];

        // --- type/presence validation ---
        if (typeof configData.component !== 'string' || configData.component.trim().length === 0) {
            // missing component
            throw new Error('Configuration Item requires a valid non-empty "component".');
        }

        // component is plants but "project" and/or "insect_project" is not set.
        if( configData.component === CONST_CONFIG_OBJ_PLANTS && (configData.project.trim().length === 0 || configData.insect_project.trim().length === 0 ) ) {
            throw new Error('Configuration Item requires valid non-empty "project" and "insect_project" attributes.');
        }
        // component is hiker but "project" is not set.
        if( configData.component === CONST_CONFIG_OBJ_HIKER && configData.project.trim().length === 0 ) {
            throw new Error('Configuration Item requires a valid non-empty "project".');
        }
        // component is art but "project" is not set.
        if( configData.component === CONST_CONFIG_OBJ_ART && configData.project.trim().length === 0 ) {
            throw new Error('Configuration Item requires a valid non-empty "project".');
        }
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
 */
class ConfigManager {
    /**
     * @param {object} jsonData - The raw JSON object imported into JavaScript.
     */
    constructor(jsonData) {
        this.configurations = jsonData.configurations.map(config => {
            return new ConfigurationItem(config);
        });
        
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
   
   // We will store the final config/manager instance we want to return here
   let finalConfigInstance;

   // --- Check the cache first ---
   if( cachedData ) {
       console.log('Returning configuration from cache: ' + storageKey);
       try {
          const rawData = JSON.parse(cachedData);
          
          // REHYDRATE: If we have cached data, we must convert it back into class instances
          const managerInstance = new ConfigManager(rawData);
          
          // Determine what to return
          if (component) {
              finalConfigInstance = managerInstance.getConfigByComponent(component);
          } else {
              finalConfigInstance = managerInstance; // Return the whole manager if no specific component requested
          }

          if (finalConfigInstance) {
              return finalConfigInstance; // Successfully retrieved from cache
          } else {
              // Component not found in cached data, maybe the config structure changed?
              throw new Error(`Requested component "${component}" not found in cache.`);
          }

       } catch (e) {
          console.error("Error processing cached configuration, fetching new data:", e.message);
          sessionStorage.removeItem(storageKey); // Clear bad cache entry
          // Continue execution to fetch fresh data
       }
   }  
    
   // --- Fetch New Data (Only runs if cache check failed or missed) ---

   if( !params ) {
       throw new Error(`Name of .json file must be specified in the URL/params.`);
   }

   try {
      const response = await fetch(params + '.json');

      if( !response.ok ) {
          if( response.status === 404 ) {
              throw new Error(`A parameters file named ${params} has no matching .json configuration file.`);
          }
          throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
       
      // If the ConfigManager constructor throws a validation error, 
      // the `catch` block immediately below will execute.
      const manager = new ConfigManager(data);

      // Store data in session storage BEFORE returning
      // We store the *entire* manager object structure as a string
      sessionStorage.setItem(storageKey, JSON.stringify(manager));
      console.log('Stored configuration in session storage: ' + storageKey);

      // Determine what to return from the fetch path
      if (component) {
        // Return a single configuration item
        finalConfigInstance = manager.getConfigByComponent(component);
        if (!finalConfigInstance) {
            throw new Error(`Requested component "${component}" not found in the fetched configuration.`);
        }
      } else {
        // Return the full manager instance
        finalConfigInstance = manager;
      }
      
      return finalConfigInstance;  

   } catch (error) {
      // This catches Fetch errors AND validation errors from the ConfigManager constructor
      console.error('Fatal Error during configuration fetch or validation:', error.message);
      // Re-throw the error so the code that called asyncGetConfiguration can handle it 
      throw error; 
   }
}
