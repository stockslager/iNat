const CONST_CONFIGS_OBJ_PLANTS = 'plants';
const CONST_CONFIGS_OBJ_COLONIES  = 'colonies'; 
const CONST_CONFIGS_OBJ_HIKER  = 'hiker'; 
const CONST_CONFIGS_OBJ_YARD   = 'yard'; 
const CONST_CONFIGS_OBJ_ART    = 'art';  

/**
 * Represents a single place entry.
 */
class Place {
    constructor(data) {
        this.placeId = data.place_id;
        this.placeName = data.place_name;
    }
}

/**
 * Represents a single taxon entry (e.g., American Asters).
 */
class Taxon {
    constructor(data) {
        this.taxonId = data.taxon_id;
        this.taxonName = data.taxon_name;
        this.icon = data.icon;
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
 * Represents a dd_obs_field entry.
 */
class DDObsField {
    constructor(data) {
        this.ddName     = data.dd_name;
        this.fieldName  = data.field_name;
        this.fieldValue = data.field_value;
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
        this.colonyProject = configData.colony_project ?? null;
        this.userId = configData.user_id ?? null; // Should now consistently show the ID or null
        this.title = configData.title ?? null;

        // Ensure hideOnAny results in a boolean or default to true
        this.hideOnAny = (configData.hide_on_any === 'yes') ?? true; 

        this.plantIds   = configData.plant_ids ?? null;
        this.plantField = configData.plant_field ?? null;
        this.plantFieldValue = configData.plant_field_value ?? null;
        this.plantListUserId = configData.plant_list_user_id ?? null;
        this.plantTagName    = configData.plant_tag_name ?? null;
        this.usePlantProjectImages = configData.use_plant_project_images ?? null;
        this.lsMapExtent = configData.ls_mapextent ?? null;
        this.defaultPlace = configData.default_place ?? null;
        this.fieldId = configData.field_id ?? null;
        this.fieldName = configData.field_name ?? null;
        this.fieldValue = configData.field_value ?? null;

        this.studyTitle = configData.study_title ?? null;
        this.studyDesc  = configData.study_desc ?? null;
        this.defaultTaxonId = configData.default_taxon_id ?? null;
        this.utf8         = configData.utf8 ?? null;
        this.obsAPIParams = configData.obs_api_params ?? null;
        this.faunaAPIParams = configData.fauna_api_params ?? null;
        this.ofieldIconic = configData.ofield_iconic ?? null;
        this.merge        = configData.merge ?? null;

        this.obsFields = configData.obs_fields ?? configData.field_id ?? null;
        
        // Map nested arrays, default to empty array if missing
        this.places = configData.places?.map(t => new Place(t)) ?? [];
        this.taxa   = configData.taxa?.map(t => new Taxon(t)) ?? [];
        this.subIcons = configData.sub_icons?.map(s => new SubIcon(s)) ?? [];
        this.ddObsFields = configData.dd_obs_fields?.map(d => new DDObsField(d)) ?? [];
        
        // store the orginial .json with original field names that haven't been mapped to this object.
        this.originalConfig = configData ?? null;  // used in about.html to pretty print the original .json

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

    // find the taxon name given the taxon_id in the list of sub_icons in the configuration
    getSubIconNameByTaxonId( plantsConfig, taxon_id ) {
        let sub_icon_name = '';

        if( this.subIcons ) {
            for( let i=0; i<this.subIcons.length; i++) {
                 if( this.subIcons[i].taxonId.toString() === taxon_id.toString() ) {
                     sub_icon_name = this.subIcons[i].name;
                     break;
                 }
            }
        }

        if( !sub_icon_name ) { console.log('Sub Icon Name Not Found'); }
    
        return sub_icon_name;
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
        this.defaultSubIcons = jsonData.default_sub_icons?.map(ds => new SubIcon(ds)) ?? [];
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
              // if the sub-icons haven't been set, look for the default.
              if( !finalConfigInstance.subIcons || finalConfigInstance.subIcons.length === 0 ) {
                  if( managerInstance.defaultSubIcons ) {
                      // deep copy the default sub-icons.
                      finalConfigInstance.subIcons = JSON.parse(JSON.stringify(managerInstance.defaultSubIcons));
                  }
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

        // if the sub-icons haven't been set, look for the default.
        if( !finalConfigInstance.subIcons || finalConfigInstance.subIcons.length === 0 ) {
            if( managerInstance.defaultSubIcons ) {
                // deep copy the default sub-icons.
                finalConfigInstance.subIcons = JSON.parse(JSON.stringify(managerInstance.defaultSubIcons));
            }
        }
      
        return finalConfigInstance; 

   } catch (error) {
      console.error('Fatal Error during configuration fetch:', error.message);
      throw error; 
   }
}

