// store.js

// --- Constants for Attribute Keys ---
const ATTRIBUTE_PROJECT   = 'project';
const ATTRIBUTE_PLACE     = 'place';
const ATTRIBUTE_PARAMS    = 'params';
const ATTRIBUTE_USER      = 'user';
const ATTRIBUTE_GARDEN    = 'garden';
const ATTRIBUTE_COMPONENT = 'component';
const ATTRIBUTE_PLANTID   = 'plantid';
const ATTRIBUTE_PLANTNAME = 'plantname';
const ATTRIBUTE_TAXONID   = 'taxonid';
const ATTRIBUTE_MENUID    = 'menuid';
const ATTRIBUTE_MENUNAME  = 'menuname';
const ATTRIBUTE_TAXONDD   = 'taxondd';
const ATTRIBUTE_PAGE      = 'page';
const ATTRIBUTE_PER_PAGE  = 'per_page';

// application state
let appState = {
  [ATTRIBUTE_PROJECT]:   '',
  [ATTRIBUTE_PLACE]:     '',
  [ATTRIBUTE_PARAMS]:    '',
  [ATTRIBUTE_USER]:      '',
  [ATTRIBUTE_GARDEN]:    '',
  [ATTRIBUTE_COMPONENT]: '',
  [ATTRIBUTE_PLANTID]:   '',
  [ATTRIBUTE_PLANTNAME]: '',
  [ATTRIBUTE_TAXONID]:   '',
  [ATTRIBUTE_MENUID]:    '',
  [ATTRIBUTE_MENUNAME]:  '',
  [ATTRIBUTE_TAXONDD]:   '',
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
    [ATTRIBUTE_PLACE]:     '',
    [ATTRIBUTE_PARAMS]:    '',
    [ATTRIBUTE_USER]:      '',
    [ATTRIBUTE_GARDEN]:    '',
    [ATTRIBUTE_COMPONENT]: '',
    [ATTRIBUTE_PLANTID]:   '', 
    [ATTRIBUTE_PLANTNAME]: '',
    [ATTRIBUTE_TAXONID]:   '',
    [ATTRIBUTE_MENUID]:    '', 
    [ATTRIBUTE_MENUNAME]:  '',
    [ATTRIBUTE_TAXONDD]:   '',
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
function getPlace(state)     { return (getAttribute(state, ATTRIBUTE_PLACE)); }
function getProject(state)   { return (getAttribute(state, ATTRIBUTE_PROJECT)); }
function getParams(state)    { return (getAttribute(state, ATTRIBUTE_PARAMS)); }
function getUser(state)      { return (getAttribute(state, ATTRIBUTE_USER)); }
function getGarden(state)    { return (getAttribute(state, ATTRIBUTE_GARDEN)); }
function getComponent(state) { return (getAttribute(state, ATTRIBUTE_COMPONENT)); }
function getPlantId(state)   { return (getAttribute(state, ATTRIBUTE_PLANTID)); }
function getPlantName(state) { return (getAttribute(state, ATTRIBUTE_PLANTNAME)); }
function getTaxonId(state)   { return (getAttribute(state, ATTRIBUTE_TAXONID)); }
function getMenuId(state)    { return (getAttribute(state, ATTRIBUTE_MENUID)); }
function getMenuName(state)  { return (getAttribute(state, ATTRIBUTE_MENUNAME)); }
function getTaxonDD(state)   { return (getAttribute(state, ATTRIBUTE_TAXONDD)); }
function getPage(state)      { return (getAttribute(state, ATTRIBUTE_PAGE)); }
function getPerPage(state)   { return (getAttribute(state, ATTRIBUTE_PER_PAGE)); }

/*
 * Helper Setters (Optional but Recommended) ---
 * Remember to reassign the result of these functions back to 'applicationState'
 * in your main application logic.
 */
function setPlace(state, value)      { return (setAttribute(state, ATTRIBUTE_PLACE, value)); }
function setProject(state, value)    { return (setAttribute(state, ATTRIBUTE_PROJECT, value)); }
function setParams(state, value)     { return (setAttribute(state, ATTRIBUTE_PARAMS, value)); }
function setUser(state, value)       { return (setAttribute(state, ATTRIBUTE_USER, value)); }
function setGarden(state, value)     { return (setAttribute(state, ATTRIBUTE_GARDEN, value)); }
function setComponent(state, value)  { return (setAttribute(state, ATTRIBUTE_COMPONENT, value)); }
function setPlantId(state, value)    { return (setAttribute(state, ATTRIBUTE_PLANTID, value)); }
function setPlantName(state, value)  { return (setAttribute(state, ATTRIBUTE_PLANTNAME, value)); }
function setTaxonId(state, value)    { return (setAttribute(state, ATTRIBUTE_TAXONID, value)); }
function setMenuId(state, value)     { return (setAttribute(state, ATTRIBUTE_MENUID, value)); }
function setMenuName(state, value)   { return (setAttribute(state, ATTRIBUTE_MENUNAME, value)); }
function setTaxonDD(state, value)    { return (setAttribute(state, ATTRIBUTE_TAXONDD, value)); }
function setPage(state, value)       { return (setAttribute(state, ATTRIBUTE_PAGE, value)); }
function setPerPage(state, value)    { return (setAttribute(state, ATTRIBUTE_PER_PAGE, value)); }

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

function getTaxonDDParam(state, param_nm)   { 
  let taxon_dd = getTaxonDD(state);
  if( taxon_dd ) { 
      return (param_nm + taxon_dd);
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
  
  // getParams(state) returns the value of the 'params' attribute.
  // The '!' operator checks if that value is falsy (empty string, null, undefined, false, 0)
  if( !getParams(state) ) {
      let message = 'Params are required.  There is no value in the &amp;params parameter.  ' +
                    'The value should match the name of a .json configuration file';
      return message;
  }

  if( !getComponent(state) ) {
      let message = 'Component name required.  Component name is required for displaying data.' +   
                    'Component name should exist in the configuration file identified by the &amp;params=xxxxx';
      return message;
  }

  return;
}

/*
 * Used from the pages in the app that display the plant list (GardenList.html)
 * Used to reset params before rendering the back link in the plant list menu.
 * @param {object} state The current application state object.
 * @returns {object} a copy with new values stored on a new state to supply url parameters to a link.
 */
function clearGardenListParams(state) {
  let urlState = state; 

  urlState = setTaxonId( urlState, '' );
  urlState = setPlace( urlState, '' );

  return urlState;
}

/*
 * Used from the pages in the app that display species counts (GardenActivity.html, ThruHiker.html, etc.)
 * Used for params before rendering the back link in the species counts menu and before rendering the links 
 * in the Show drop down for e.g.
 * @param {object} state The current application state object.
 * @returns {object} a copy with new values stored on a new state to supply url parameters to a link.
 */
function clearSpeciesCountsParams(state) {
  let urlState = state;  
      
  urlState = setTaxonId(urlState, '');
  urlState = setMenuId(urlState, '');
  urlState = setPage(urlState, '');
  urlState = setPerPage(urlState, '');
  urlState = setTaxonDD(urlState, '');

  return urlState;
}

/*
 * Used from the pages in the app that display the images grid (GardenGrid.html, ThruHikerGrid.html, etc.)
 * Used to reset params before rendering the back link in the grid menu.
 * @param {object} state The current application state object.
 * @returns {object} a copy with new values stored on a new state to supply url parameters to a link.
 */
function clearGridParams(state) {
  let urlState = state; 

  urlState = setTaxonId( urlState, '' );

  return urlState;
}
  
