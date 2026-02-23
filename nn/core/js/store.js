// store.js
const COMPONENT_GARDEN    = 'plants';
const COMPONENT_COLONY    = 'colonies';
const COMPONENT_OBSERVERS = 'observers';
const COMPONENT_HIKER     = 'hiker';
const COMPONENT_YARD      = 'yard';
const COMPONENT_ART       = 'art';
const COMPONENT_ANIMALS   = 'animals';
const COMPONENT_STUDIES   = 'studies';

// --- Constants for Attribute Keys ---
const ATTRIBUTE_PROJECT         = 'project';
const ATTRIBUTE_STUDY_TITLE     = 'studytitle';
const ATTRIBUTE_PLACE           = 'place';
const ATTRIBUTE_PARAMS          = 'params';
const ATTRIBUTE_USER            = 'user';
const ATTRIBUTE_GARDEN          = 'garden';
const ATTRIBUTE_COMPONENT       = 'component';
const ATTRIBUTE_PLANTID         = 'plantid';
const ATTRIBUTE_PLANTNAME       = 'plantname';
const ATTRIBUTE_TAXONID         = 'taxonid';
const ATTRIBUTE_TAXONNAME       = 'taxonname';
const ATTRIBUTE_LSTAXONID       = 'lstaxonid';
const ATTRIBUTE_MENUID          = 'menuid';
const ATTRIBUTE_MENUNAME        = 'menuname';
const ATTRIBUTE_PLANTMENUID     = 'plantmenuid';
const ATTRIBUTE_PLANTMENUNAME   = 'plantmenuname';
const ATTRIBUTE_PLACEMENUID     = 'placemenuid';
const ATTRIBUTE_PLACEMENUNAME   = 'placemenuname';
const ATTRIBUTE_GARDENLISTVALUE = 'gardenlistvalue';
const ATTRIBUTE_TAXONDD         = 'taxondd';
const ATTRIBUTE_OBSID           = 'obsid';
const ATTRIBUTE_FIELDNAME       = 'fieldname';
const ATTRIBUTE_FIELDVALUE      = 'fieldvalue';
const ATTRIBUTE_PAGE            = 'page';
const ATTRIBUTE_PER_PAGE        = 'per_page';

// application state
let appState = {
  [ATTRIBUTE_PROJECT]:   '',
  [ATTRIBUTE_STUDY_TITLE]:     '',
  [ATTRIBUTE_PLACE]:     '',
  [ATTRIBUTE_PARAMS]:    '',
  [ATTRIBUTE_USER]:      '',
  [ATTRIBUTE_GARDEN]:    '',
  [ATTRIBUTE_COMPONENT]: '',
  [ATTRIBUTE_PLANTID]:   '',
  [ATTRIBUTE_PLANTNAME]: '',
  [ATTRIBUTE_TAXONID]:   '',
  [ATTRIBUTE_TAXONNAME]: '',
  [ATTRIBUTE_LSTAXONID]: '',
  [ATTRIBUTE_MENUID]:    '',
  [ATTRIBUTE_MENUNAME]:  '',
  [ATTRIBUTE_PLANTMENUID]:    '',
  [ATTRIBUTE_PLANTMENUNAME]:  '',
  [ATTRIBUTE_PLACEMENUID]:    '',
  [ATTRIBUTE_PLACEMENUNAME]:  '',
  [ATTRIBUTE_GARDENLISTVALUE]:  '',
  [ATTRIBUTE_TAXONDD]:   '',
  [ATTRIBUTE_OBSID]:     '',
  [ATTRIBUTE_FIELDNAME]: '',
  [ATTRIBUTE_FIELDVALUE]: '',
  [ATTRIBUTE_PAGE]:      '',
  [ATTRIBUTE_PER_PAGE]:  ''

};

/*
 * Creates and returns a new application state object.
 * This function defines the default structure and values for the state.
 * @param {object} initialValues Optional starting values to override defaults.
 * @returns {object} A new application state instance.
 */
function createNewStateInstance(initialValues = {}) {
  // Define the BASE or DEFAULT values for your state properties
  const baseState = {
    [ATTRIBUTE_PROJECT]:   '',
    [ATTRIBUTE_STUDY_TITLE]:     '',
    [ATTRIBUTE_PLACE]:     '',
    [ATTRIBUTE_PARAMS]:    '',
    [ATTRIBUTE_USER]:      '',
    [ATTRIBUTE_GARDEN]:    '',
    [ATTRIBUTE_COMPONENT]: '',
    [ATTRIBUTE_PLANTID]:   '', 
    [ATTRIBUTE_PLANTNAME]: '',
    [ATTRIBUTE_TAXONID]:   '',
    [ATTRIBUTE_TAXONNAME]: '',
    [ATTRIBUTE_LSTAXONID]: '',
    [ATTRIBUTE_MENUID]:    '', 
    [ATTRIBUTE_MENUNAME]:  '',
    [ATTRIBUTE_PLANTMENUID]:    '', 
    [ATTRIBUTE_PLANTMENUNAME]:  '',
    [ATTRIBUTE_PLACEMENUID]:    '', 
    [ATTRIBUTE_PLACEMENUNAME]:  '',
    [ATTRIBUTE_GARDENLISTVALUE]: '',
    [ATTRIBUTE_TAXONDD]:   '',
    [ATTRIBUTE_OBSID]:     '',
    [ATTRIBUTE_FIELDNAME]: '',
    [ATTRIBUTE_FIELDVALUE]: '',
    [ATTRIBUTE_PAGE]:      '',
    [ATTRIBUTE_PER_PAGE]:  ''
  };

  // Combine defaults with any provided initial values using the spread syntax
  return { ...baseState, ...initialValues };
}

/*
 * Builds a URL query parameter string from the current state.
 * Filters out attributes that are null, undefined, or empty strings.
 * @param {object} state The current application state object.
 * @returns {string} A formatted URL parameter string (e.g., "?key1=val1&key2=val2").
 */
function buildParameterList(state) {
  const params = new URLSearchParams();

  // Iterate over every key in the state object
  for (const key in state) {
    // Check if the property exists and isn't empty/null/undefined
    if (state.hasOwnProperty(key) && state[key] !== null && state[key] !== undefined && state[key] !== '') {
      params.append(key, state[key]);
    }
  }

  // URLSearchParams automatically handles encoding and formatting
  const queryString = params.toString();

  // Return with a leading '?' if there are parameters, otherwise an empty string
  return queryString ? `?${queryString}` : '';
}

/**
 * Creates a new state instance, overlaying parameters found in a URL query string.
 * @param {string} queryString The raw query string (e.g., "?user=Bob&place=Office").
 * @returns {object} A new application state object populated from URL parameters.
 */
function buildStateFromParams(queryString) {
  // Use URLSearchParams to easily parse the string
  const params = new URLSearchParams(queryString);
  
  // Use Object.fromEntries to convert the URLSearchParams iterator into a simple object
  // Object.fromEntries is a modern JS feature
  const paramsObject = Object.fromEntries(params.entries());

  // Use the existing factory function to create a clean state with defaults,
  // then apply the parameters found in the URL over the top.
  // Note: URL parameters are always strings. If you need numbers or booleans, 
  // you may need additional logic to parse them (e.g., parseInt(value)).
  const newState = createNewStateInstance(paramsObject);

  return newState;
}

/*
 * Core Get/Set Functions ---
 * Retrieves a value from the state object using a dynamic attribute key.
 * @param {object} state The current state object.
 * @param {string} attribute The key name to retrieve (e.g., 'place').
 * @returns {*} The value associated with the attribute, or undefined if not found.
 */
function getAttribute(state, attribute) {
  if (state.hasOwnProperty(attribute)) {
    return state[attribute];
  } else {
    console.log(`Unknown state request for attribute: ${attribute}`);
    return undefined; 
  }
}

/*
 * Updates the state immutably by returning a new state object with the updated value.
 * @param {object} state The current state object.
 * @param {string} attribute The key name to set (e.g., 'place').
 * @param {*} value The new value to assign to the key.
 * @returns {object} A brand new state object with the updated attribute.
 */
function setAttribute(state, attribute, value) {
  // Use the spread syntax to create a new object and overwrite the specified key
  const newState = { ...state, [attribute]: value };
  return newState;
}

/*
 * Helper Getters 
 * These abstract away the getAttribute call for cleaner code elsewhere.
 */
function getPlace(state)           { return (getAttribute(state, ATTRIBUTE_PLACE)); }
function getProject(state)         { return (getAttribute(state, ATTRIBUTE_PROJECT)); }
function getStudyTitle(state)           { return (getAttribute(state, ATTRIBUTE_STUDY_TITLE)); }
function getParams(state)          { return (getAttribute(state, ATTRIBUTE_PARAMS)); }
function getUser(state)            { return (getAttribute(state, ATTRIBUTE_USER)); }
function getGarden(state)          { return (getAttribute(state, ATTRIBUTE_GARDEN)); }
function getComponent(state)       { return (getAttribute(state, ATTRIBUTE_COMPONENT)); }
function getPlantId(state)         { return (getAttribute(state, ATTRIBUTE_PLANTID)); }
function getPlantName(state)       { return (getAttribute(state, ATTRIBUTE_PLANTNAME)); }
function getTaxonId(state)         { return (getAttribute(state, ATTRIBUTE_TAXONID)); }
function getTaxonName(state)       { return (getAttribute(state, ATTRIBUTE_TAXONNAME)); }
function getLSTaxonId(state)       { return (getAttribute(state, ATTRIBUTE_LSTAXONID)); }
function getMenuId(state)          { return (getAttribute(state, ATTRIBUTE_MENUID)); }
function getMenuName(state)        { return (getAttribute(state, ATTRIBUTE_MENUNAME)); }
function getPlantMenuId(state)     { return (getAttribute(state, ATTRIBUTE_PLANTMENUID)); }
function getPlantMenuName(state)   { return (getAttribute(state, ATTRIBUTE_PLANTMENUNAME)); }
function getPlaceMenuId(state)     { return (getAttribute(state, ATTRIBUTE_PLACEMENUID)); }
function getPlaceMenuName(state)   { return (getAttribute(state, ATTRIBUTE_PLACEMENUNAME)); }
function getGardenListValue(state) { return (getAttribute(state, ATTRIBUTE_GARDENLISTVALUE)); }
function getTaxonDD(state)         { return (getAttribute(state, ATTRIBUTE_TAXONDD)); }
function getObsId(state)           { return (getAttribute(state, ATTRIBUTE_OBSID)); }
function getFieldName(state)       { return (getAttribute(state, ATTRIBUTE_FIELDNAME)); }
function getFieldValue(state)      { return (getAttribute(state, ATTRIBUTE_FIELDVALUE)); }
function getPage(state)            { return (getAttribute(state, ATTRIBUTE_PAGE)); }
function getPerPage(state)         { return (getAttribute(state, ATTRIBUTE_PER_PAGE)); }

/*
 * Helper Setters (Optional but Recommended) ---
 * Remember to reassign the result of these functions back to 'applicationState'
 * in your main application logic.
 */
function setPlace(state, value)           { return (setAttribute(state, ATTRIBUTE_PLACE, value)); }
function setProject(state, value)         { return (setAttribute(state, ATTRIBUTE_PROJECT, value)); }
function setStudyTitle(state, value)           { return (setAttribute(state, ATTRIBUTE_STUDY_TITLE, value)); }
function setParams(state, value)          { return (setAttribute(state, ATTRIBUTE_PARAMS, value)); }
function setUser(state, value)            { return (setAttribute(state, ATTRIBUTE_USER, value)); }
function setGarden(state, value)          { return (setAttribute(state, ATTRIBUTE_GARDEN, value)); }
function setComponent(state, value)       { return (setAttribute(state, ATTRIBUTE_COMPONENT, value)); }
function setPlantId(state, value)         { return (setAttribute(state, ATTRIBUTE_PLANTID, value)); }
function setPlantName(state, value)       { return (setAttribute(state, ATTRIBUTE_PLANTNAME, value)); }
function setTaxonId(state, value)         { return (setAttribute(state, ATTRIBUTE_TAXONID, value)); }
function setTaxonName(state, value)       { return (setAttribute(state, ATTRIBUTE_TAXONNAME, value)); }
function setLSTaxonId(state, value)       { return (setAttribute(state, ATTRIBUTE_LSTAXONID, value)); }
function setMenuId(state, value)          { return (setAttribute(state, ATTRIBUTE_MENUID, value)); }
function setMenuName(state, value)        { return (setAttribute(state, ATTRIBUTE_MENUNAME, value)); }
function setPlantMenuId(state, value)     { return (setAttribute(state, ATTRIBUTE_PLANTMENUID, value)); }
function setPlantMenuName(state, value)   { return (setAttribute(state, ATTRIBUTE_PLANTMENUNAME, value)); }
function setPlaceMenuId(state, value)     { return (setAttribute(state, ATTRIBUTE_PLACEMENUID, value)); }
function setPlaceMenuName(state, value)   { return (setAttribute(state, ATTRIBUTE_PLACEMENUNAME, value)); }
function setGardenListValue(state, value) { return (setAttribute(state, ATTRIBUTE_GARDENLISTVALUE, value)); }
function setTaxonDD(state, value)         { return (setAttribute(state, ATTRIBUTE_TAXONDD, value)); }
function setObsId(state, value)           { return (setAttribute(state, ATTRIBUTE_OBSID, value)); }
function setFieldName(state, value)       { return (setAttribute(state, ATTRIBUTE_FIELDNAME, value)); }
function setFieldValue(state, value)      { return (setAttribute(state, ATTRIBUTE_FIELDVALUE, value)); }
function setPage(state, value)            { return (setAttribute(state, ATTRIBUTE_PAGE, value)); }
function setPerPage(state, value)         { return (setAttribute(state, ATTRIBUTE_PER_PAGE, value)); }

/*
 * Helper Getters 
 * These take the state and a url parameter name as input (e.g. &place_id=).
 * They concatenate the attribute value after the param_nm and return the concatenated string.
 * They simplify code for downstream api's. 
 */
function getPlaceParam(state, param_nm) { 
  let place = getPlace(state);
  if( place ) { 
      return (param_nm + place);
  } else {
      return '';
  }
}

function getProjectParam(state, param_nm)   { 
  let project = getProject(state);
  if( project ) { 
      return (param_nm + project);
  } else {
      return '';
  }
}

function getUserParam(state, param_nm)      { 
  let user = getUser(state);
  if( user ) { 
      return (param_nm + user);
  } else {
      return '';
  }
}

function getPlantIdParam(state, param_nm)   { 
  let plant_id = getPlantId(state);
  if( plant_id ) { 
      return (param_nm + plant_id);
  } else {
      return '';
  }
}

function getTaxonIdParam(state, param_nm)   { 
  let taxon_id = getTaxonId(state);
  if( taxon_id ) { 
      return (param_nm + taxon_id);
  } else {
      return '';
  }
}

function getTaxonNameParam(state, param_nm)   { 
  let taxon_name = getTaxonName(state);
  if( taxon_name ) { 
      return (param_nm + taxon_name);
  } else {
      return '';
  }
}

function getLSTaxonIdParam(state, param_nm)   { 
  let ls_taxon_id = getLSTaxonId(state);
  if( ls_taxon_id ) { 
      return (param_nm + ls_taxon_id);
  } else {
      return '';
  }
}

function getMenuIdParam(state, param_nm)      { 
  let menu_id = getMenuId(state);
  if( menu_id ) { 
      return (param_nm + menu_id);
  } else {
      return '';
  }
}

function getMenuNameParam(state, param_nm)   { 
  let menu_name = getMenuName(state);
  if( menu_name ) { 
      return (param_nm + menu_name);
  } else {
      return '';
  }
}

function getPlantMenuIdParam(state, param_nm)      { 
  let menu_id = getMenuId(state);
  if( menu_id ) { 
      return (param_nm + menu_id);
  } else {
      return '';
  }
}

function getPlantMenuNameParam(state, param_nm)   { 
  let menu_name = getMenuName(state);
  if( menu_name ) { 
      return (param_nm + menu_name);
  } else {
      return '';
  }
}

function getPlaceMenuIdParam(state, param_nm)      { 
  let menu_id = getPlaceMenuId(state);
  if( menu_id ) { 
      return (param_nm + menu_id);
  } else {
      return '';
  }
}

function getPlaceMenuNameParam(state, param_nm)   { 
  let menu_name = getMenuName(state);
  if( menu_name ) { 
      return (param_nm + menu_name);
  } else {
      return '';
  }
}

function getGardenListValueParam(state, param_nm)   { 
  let garden_list_value = getGardenListValue(state);
  if( garden_list_value ) { 
      return (param_nm + garden_list_value);
  } else {
      return '';
  }
}

function getTaxonDDParam(state, param_nm)   { 
  let taxon_dd = getTaxonDD(state);
  if( taxon_dd ) { 
      return (param_nm + taxon_dd);
  } else {
      return '';
  }
}

function getObsIdParam(state, param_nm)   { 
  let obs_id = getObsId(state);
  if( obs_id ) { 
      return (param_nm + obs_id);
  } else {
      return '';
  }
}

function getFieldNameParam(state, param_nm)   { 
  let field_name = getFieldName(state);
  if( field_name ) { 
      return (param_nm + field_name);
  } else {
      return '';
  }
}

function getFieldVaueParam(state, param_nm)   { 
  let field_value = getFieldValue(state);
  if( field_value ) { 
      return (param_nm + field_value);
  } else {
      return '';
  }
}

function getPageParam(state, param_nm)   { 
  let page = getPage(state);
  if( page ) { 
      return (param_nm + page);
  } else {
      return '';
  }
}

function getPerPageParam(state, param_nm)   { 
  let per_page = getPerPage(state);
  if( per_page ) { 
      return (param_nm + per_page);
  } else {
      return '';
  }
}

// validate params for dashboard
function validateDashboardParams(state) {
  let message = '';
  
  if( !getParams(state) ) {
      let message = 'Params are required.  There is no value in the &amp;params parameter.  ' +
                    'The value should match the name of a .json configuration file';
      return message;
  }
}

// validate params for garden_list
function validateGardenListParams(state) {
  let message = '';
  
  if( !getParams(state) ) {
      let message = 'Params are required.  There is no value in the &amp;params parameter.  ' +
                    'The value should match the name of a .json configuration file';
      return message;
  }

  if( !getComponent(state) ) {
      let message = 'Component is required.  There is no value in the &amp;component parameter.  ' +
                    'The value should match the name of a .json configuration file';
      return message;
  }

  // can be used from two components
  if( getComponent(state) !== COMPONENT_OBSERVERS  && getComponent(state) !== COMPONENT_GARDEN ){
      let message = 'Invalid Component.  ' +
                    'The value for the component param should match the name of a component in the .json configuration file';
      return message;
  }
}

/*
 * component based validation
 *
 * Validates the state for parameters requirements.
 * Ensures the 'params' attribute has a value.
 * Everything else should come from the configuration.
 * Configuration is validated in configuration.js
 * 
 * @param {object} state The current application state object.
 * @returns {string} An error message if invalid, otherwise an empty string.
 */
function validateConfig(state) {
  let message = '';
  
  if( !getParams(state) ) {
      let message = 'Params are required.  There is no value in the &amp;params parameter.  ' +
                    'The value should match the name of a .json configuration file';
      return message;
  }

  return;
}

/*
 * component based validation
 *
 * Validates the state for Hiker-specific requirements.
 * Ensures the 'params' attribute has a value.
 * Ensures the 'component' attribute has a value. 
 * Everything else should come from the configuration.
 * Configuration is validated in configuration.js
 * 
 * @param {object} state The current application state object.
 * @returns {string} An error message if invalid, otherwise an empty string.
 */
function validateHiker(state) {
  let message = '';

  message = validateConfig(state);
  if( message ) { return message; }

  if( getComponent(state) !== COMPONENT_HIKER ) {
      let message = 'Component name required.  Component name is required for displaying data.' +   
                    'Component name should exist in the configuration file identified by the &amp;params=xxxxx';
      return message;
  }

  return;
}

/*
 * component based validation
 *
 * Validates the state for Observers-specific requirements.
 * Ensures the 'params' attribute has a value.
 * Ensures the 'component' attribute has a value. 
 * Everything else should come from the configuration.
 * Configuration is validated in configuration.js
 * 
 * @param {object} state The current application state object.
 * @returns {string} An error message if invalid, otherwise an empty string.
 */
function validateObservers(state) {
  let message = '';

  message = validateConfig(state);
  if( message ) { return message; }

  if( getComponent(state) !== COMPONENT_OBSERVER ) {
      let message = 'Component name required.  Component name is required for displaying data.' +   
                    'Component name should exist in the configuration file identified by the &amp;params=xxxxx';
      return message;
  }

  return;
}

/*
 * component based validation
 *
 * Validates the state for Garden-specific requirements.
 * Ensures the 'params' attribute has a value.
 * Ensures the 'component' attribute has a value. 
 * Everything else should come from the configuration.
 * Configuration is validated in configuration.js
 * 
 * @param {object} state The current application state object.
 * @returns {string} An error message if invalid, otherwise an empty string.
 */
function validateGarden(state) {
  let message = '';
  
  message = validateConfig(state);
  if( message ) { return message; }

  if( getComponent(state) !== COMPONENT_GARDEN ) {
      let message = 'Component name required.  Component name is required for displaying data.' +   
                    'Component name should exist in the configuration file identified by the &amp;params=xxxxx';
      return message;
  }

  return;
}

/*
 * component based validation
 *
 * Validates the state for Colony-specific requirements.
 * Ensures the 'params' attribute has a value.
 * Ensures the 'component' attribute has a value. 
 * Everything else should come from the configuration.
 * Configuration is validated in configuration.js
 * 
 * @param {object} state The current application state object.
 * @returns {string} An error message if invalid, otherwise an empty string.
 */
function validateColony(state) {
  let message = '';
  
  message = validateConfig(state);
  if( message ) { return message; }

  if( getComponent(state) !== COMPONENT_COLONY ) {
      let message = 'Component name required.  Component name is required for displaying data.' +   
                    'Component name should exist in the configuration file identified by the &amp;params=xxxxx';
      return message;
  }

  return;
}

/*
 * component based validation
 *
 * Validates the state for animals-specific requirements.
 * Ensures the 'params' attribute has a value.
 * Ensures the 'component' attribute has a value. 
 * Everything else should come from the configuration.
 * Configuration is validated in configuration.js
 * 
 * @param {object} state The current application state object.
 * @returns {string} An error message if invalid, otherwise an empty string.
 */
function validateAnimals(state) {
  let message = '';
  
  message = validateConfig(state);
  if( message ) { return message; }

  if( getComponent(state) !== COMPONENT_ANIMALS ) {
      let message = 'Component name required.  Component name is required for displaying data.' +   
                    'Component name should exist in the configuration file identified by the &amp;params=xxxxx';
      return message;
  }

  return;
}

/*
 * component based validation
 *
 * Validates the state for observer-specific requirements.
 * Ensures the 'params' attribute has a value.
 * Ensures the 'component' attribute has a value. 
 * Everything else should come from the configuration.
 * Configuration is validated in configuration.js
 * 
 * @param {object} state The current application state object.
 * @returns {string} An error message if invalid, otherwise an empty string.
 */
function validateObservers(state) {
  let message = '';
  
  message = validateConfig(state);
  if( message ) { return message; }

  if( getComponent(state) !== COMPONENT_OBSERVERS ) {
      let message = 'Component name required.  Component name is required for displaying data.' +   
                    'Component name should exist in the configuration file identified by the &amp;params=xxxxx';
      return message;
  }

  return;
}

/*
 * component based validation
 *
 * Validates the state for yard specific requirements.
 * Ensures the 'params' attribute has a value.
 * Ensures the 'component' attribute has a value. 
 * Everything else should come from the configuration.
 * Configuration is validated in configuration.js
 * 
 * @param {object} state The current application state object.
 * @returns {string} An error message if invalid, otherwise an empty string.
 */
function validateYard(state) {
  let message = '';
  
  message = validateConfig(state);
  if( message ) { return message; }

  if( getComponent(state) !== COMPONENT_YARD ) {
      let message = 'Component name required.  Component name is required for displaying data.' +   
                    'Component name should exist in the configuration file identified by the &amp;params=xxxxx';
      return message;
  }

  return;
}

/*
 * component based validation
 *
 * Validates the state for Artwork specific requirements.
 * Ensures the 'params' attribute has a value.
 * Ensures the 'component' attribute has a value. 
 * Everything else should come from the configuration.
 * Configuration is validated in configuration.js
 * 
 * @param {object} state The current application state object.
 * @returns {string} An error message if invalid, otherwise an empty string.
 */
function validateArt(state) {
  let message = '';
  
  message = validateConfig(state);
  if( message ) { return message; }

  if( getComponent(state) !== COMPONENT_ART ) {
      let message = 'Component name required.  Component name is required for displaying data.' +   
                    'Component name should exist in the configuration file identified by the &amp;params=xxxxx';
      return message;
  }

  return;
}

/*
 * component based validation
 *
 * Validates the state for Studies specific requirements.
 * Ensures the 'params' attribute has a value.
 * Ensures the 'component' attribute has a value. 
 * Everything else should come from the configuration.
 * Configuration is validated in configuration.js
 * 
 * @param {object} state The current application state object.
 * @returns {string} An error message if invalid, otherwise an empty string.
 */
function validateStudies(state) {
  let message = '';
  
  message = validateConfig(state);
  if( message ) { return message; }

  if( getComponent(state) !== COMPONENT_STUDIES ) {
      let message = 'Component name required.  Component name is required for displaying data.' +   
                    'Component name should exist in the configuration file identified by the &amp;params=xxxxx';
      return message;
  }

  if( !getStudyTitle(state) ) {
      let message = 'study_title is required for the colonies component.' + 
                    'study_title should be added for this study in the ' + getParams(state) + '.json file.';
  }

  return;
}

/*
 * Used to clean up the state when returning to the garden list. 
 * @param {object} state The current application state object.
 * @returns {object} a copy with new values stored on a new state.
 */
function clearForGardenListParams(state) {
  let urlState = state;  

  urlState = setPlace(urlState, '');
  urlState = setUser(urlState, '');
  urlState = setTaxonId(urlState, ''); 
  urlState = setTaxonName(urlState, '');
  urlState = setLSTaxonId(urlState, '');
  urlState = setPlantId(urlState, '');
  urlState = setPlantName(urlState, '');
  urlState = setMenuId(urlState, '');
  urlState = setMenuName(urlState, '');
  urlState = setTaxonDD(urlState, '');
  urlState = setObsId(urlState, '');
  urlState = setPage(urlState, '');
  urlState = setPerPage(urlState, '');

  return urlState;
}

/*
 * Used to clean up the state when returning to the observer counts. 
 * @param {object} state The current application state object.
 * @returns {object} a copy with new values stored on a new state.
 */
function clearForObserverCountsParams(state) {
  let urlState = state;  

  urlState = setPlace(urlState, '');
  urlState = setUser(urlState, '');
  urlState = setTaxonId(urlState, ''); 
  urlState = setTaxonName(urlState, '');
  urlState = setLSTaxonId( urlState, '');
  //urlState = setPlantId(urlState, '');  // need to save these if returning after "choose plant" with plant in focus
  //urlState = setPlantName(urlState, '');
  urlState = setMenuId(urlState, '');
  urlState = setMenuName(urlState, '');
  urlState = setTaxonDD(urlState, '');
  urlState = setPage(urlState, '');
  urlState = setPerPage(urlState, '');

  return urlState;
}

/*
 * Used to clean up the state when returning to the dashboard. 
 * @param {object} state The current application state object.
 * @returns {object} a copy with new values stored on a new state.
 */
function clearForDashParams(state) {
  let urlState = state;  

  urlState = setPlace(urlState, '');
  urlState = setProject(urlState, '');
  urlState = setStudyTitle(urlState, '');
  urlState = setUser(urlState, '');
  urlState = setGarden(urlState, '');
  urlState = setComponent(urlState, '');
  urlState = setPlantId(urlState, '');
  urlState = setPlantName(urlState, '');
  urlState = setTaxonId(urlState, ''); 
  urlState = setTaxonName(urlState, '');
  urlState = setLSTaxonId( urlState, '');
  urlState = setPlantMenuId(urlState, '');
  urlState = setPlantMenuName(urlState, '');
  urlState = setPlaceMenuId(urlState, '');
  urlState = setPlaceMenuName(urlState, '');
  urlState = setGardenListValue(urlState, '');
  urlState = setMenuId(urlState, '');
  urlState = setMenuName(urlState, '');
  urlState = setTaxonDD(urlState, '');
  urlState = setObsId(urlState, '');
  urlState = setPage(urlState, '');
  urlState = setPerPage(urlState, '');
  urlState = setFieldName(urlState, '');
  urlState = setFieldValue(urlState, '');
  urlState = setStudyTitle(urlState, '');

  return urlState;
}

/*
 * Used from the pages in the app that display the images grid (GardenGrid.html, ThruHikerGrid.html, etc.)
 * Used to reset params before rendering the back link in the grid menu.
 * @param {object} state The current application state object.
 * @returns {object} a copy with new values stored on a new state to supply url parameters to a link.
 */
function clearForSpeciesCountsParams(state) {
  let urlState = state; 

  urlState = setTaxonId( urlState, '' );
  urlState = setTaxonName( urlState, '');
  urlState = setLSTaxonId( urlState, '');

  return urlState;
}
  
