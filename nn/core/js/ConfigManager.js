const CONST_CONFIGS_OBJ_PLANTS = 'plants';
const CONST_CONFIGS_OBJ_HIKER  = 'hiker';
const CONST_CONFIGS_OBJ_YARD   = 'yard'; 
const CONST_CONFIGS_OBJ_ART    = 'art';

/**
 * Represents a single taxon entry (e.g., American Asters).
 */
class Taxon {
    constructor(data) {
        this.taxonId = data.taxon_id;
        this.taxonName = data.taxon_name;
    }
}

/**
 * Represents a sub-icon entry.
 */
class SubIcon {
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
    constructor(configData) {
        // Use the nullish coalescing operator (??) to ensure properties are never undefined
        this.component = configData.component ?? null;
        this.project = configData.project ?? null;
        this.insectProject = configData.insect_project ?? null;
        this.plantProject = configData.plant_project ?? null;
        this.seedProject = configData.seed_project ?? null;
        this.userId = configData.user_id ?? null; // Should now consistently show the ID or null
        this.title = configData.title ?? null;
        
        // Ensure hideOnAny results in a boolean or default to false
        this.hideOnAny = (configData.hide_on_any === 'yes') ?? false; 
        
        this.plantField = configData.plant_field ?? null;
        this.plantFieldValue = configData.plant_field_value ?? null;
        this.defaultPlace = configData.default_place ?? null;
        this.fieldId = configData.field_id ?? null;
        this.fieldName = configData.field_name ?? null;
        this.fieldValue = configData.field_value ?? null;
        
        // Map nested arrays, default to empty array if missing
        this.taxa = configData.taxa?.map(t => new Taxon(t)) ?? [];
        this.subIcons = configData.sub_icons?.map(s => new SubIcon(s)) ?? [];

        // Validation: Change from throwing errors to logging warnings and using defaults
        const isNullOrEmpty = (value) => value === null || typeof value !== 'string' || value.trim().length === 0;

        if (isNullOrEmpty(this.component)) {
            console.warn('Component is missing for an entry. Defaulting.');
            this.component = 'default-component'; // Provide a safe default
        }
        
        if (this.component === CONST_CONFIGS_OBJ_HIKER && isNullOrEmpty(this.project)) {
            console.warn('Hiker component is missing required "project" attribute. Setting default.');
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

        if( jsonData.default_sub_icons ) {
            this.defaultSubIcons = jsonData.default_sub_icons.map(iconData => new SubIcon(iconData));
        }
    }

    getConfigByComponent(componentName) {
        return this.configurations.find(config => config.component === componentName);
    }
}

// Function handles caching of the RAW data string for consistency
async function asyncGetConfiguration( params, component ) {

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

          finalConfigInstance = component 
                                ? managerInstance.getConfigByComponent(component) 
                                : managerInstance;
          
          if (finalConfigInstance) {
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
        // ... error handling for response ...

        const data = await response.json(); // The raw data object

        // --- ADDED DEBUGGING LOGS ---
        //console.log('DEBUG: Raw data object right after fetch:', data); 
        //console.log('DEBUG: Hiker entry in raw data has userId:', data.configurations.find(c => c.component === 'hiker').user_id);
        
        // Store the *raw JSON string* in the cache immediately
        sessionStorage.setItem(storageKey, JSON.stringify(data));
        //console.log('Stored raw configuration string in session storage: ' + storageKey);
        // --- END DEBUGGING LOGS ---


        // Process the raw data using your classes
        managerInstance = new ConfigManager(data);

      finalConfigInstance = component 
                            ? managerInstance.getConfigByComponent(component) 
                            : managerInstance;
      
      return finalConfigInstance; 

   } catch (error) {
      console.error('Fatal Error during configuration fetch:', error.message);
      throw error; 
   }
}

