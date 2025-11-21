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
        // Map the main configurations array to ConfigurationItem instances
        this.configurations = jsonData.configurations.map(config => new ConfigurationItem(config));
        
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
// returns one configuration if component name is passed in
// otherwise returns all configurations.
async function asyncGetConfiguration( params, component ) {

   const storageKey   = ('nn_configCache_'+params);
   const cachedData   = sessionStorage.getItem(storageKey);

   // --- Check the cache first ---
   if( cachedData ) {
       console.log('Returning configuration from cache: ' + storageKey);
       try {
          const rawData = JSON.parse(cachedData);
          
          // Reconstruct the Manager from the raw data structure 
          // stored in the cache string. The rawData will be a generic JS object 
          // that matches the structure of the *entire* original JSON file.
          const managerInstance = new ConfigManager(rawData);
          
          // Now safely get the specific config using a class method
          const config = managerInstance.getConfigByComponent(component); 
          
          return config; 

       } catch (e) {
          console.error("Error parsing or rehydrating cached JSON:", e);
          sessionStorage.removeItem(storageKey); // Clear bad cache entry
       }
   }  
    
   console.log('fetching json: ' + params);

   if( !params ) {
       let message = `Name of .json must be specified in the url.  
                      There are no params in the url to be matched with a .json configuration file.   
                      Please add the name of a valid .json file to the url.`;
       throw new Error(message);
   }

   try {
      const response = await fetch(params + '.json');

      if( !response.ok ) {
          if( response.status === 404 ) {
              let message = `A parameters file named `+params+` has no matching .json configuration file.   
                             Please add the name of a valid .json file to the url.`;
              throw new Error(message);
          }
          throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
       console.log('h1');

      // Initialize the manager with the data
      const manager = new ConfigManager(data);
       console.log('ddddd');
console.log(`There are ${manager.configurations.length} configurations loaded.`);

const config = manager.getConfigByComponent(component);
console.log(`Found config title: ${config.getFullTitle()}`);
if( config.taxa.length > 0 ) {
    console.log(`First taxon name: ${config.taxa[0].taxonName}`);
}
console.log(`Is hidden on any condition? ${config.hideOnAny}`);

console.log('Default sub icons include:');
if( manager.defaultSubIcons ) {
    manager.defaultSubIcons.forEach(icon => {
        console.log(`- ${icon.icon} (${icon.name})`);
    });
}

      // Store data in session storage before returning 
      // sessionStorage only stores strings, so we must use JSON.stringify
      sessionStorage.setItem(storageKey, JSON.stringify(manager));
      console.log('Stored configuration in session storage: ' + storageKey);

       
      return( config );  

   } catch (error) {
      console.error('Error fetching JSON:', error);
      
      // Re-throw the error so the caller can catch it and handle it
      throw error; 
   }
}
