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

// application state
let applicationState = {
  [ATTRIBUTE_PROJECT]:   '',
  [ATTRIBUTE_PLACE]:     '',
  [ATTRIBUTE_PARAMS]:    '',
  [ATTRIBUTE_USER]:      '',
  [ATTRIBUTE_GARDEN]:    '',
  [ATTRIBUTE_COMPONENT]: '',
  [ATTRIBUTE_PLANTID]:   '',
  [ATTRIBUTE_PLANTNAME]: ''
};

// Core Get/Set Functions ---
// Retrieves a value from the state object using a dynamic attribute key.
// @param {object} state The current state object.
// @param {string} attribute The key name to retrieve (e.g., 'place').
// @returns {*} The value associated with the attribute, or undefined if not found.
function getAttribute(state, attribute) {
  if (state.hasOwnProperty(attribute)) {
    return state[attribute];
  } else {
    console.log(`Unknown state request for attribute: ${attribute}`);
    return undefined; 
  }
}

// Updates the state immutably by returning a new state object with the updated value.
// @param {object} state The current state object.
// @param {string} attribute The key name to set (e.g., 'place').
// @param {*} value The new value to assign to the key.
// @returns {object} A brand new state object with the updated attribute.
function setAttribute(state, attribute, value) {
  // Use the spread syntax to create a new object and overwrite the specified key
  const newState = { ...state, [attribute]: value };
  return newState;
}

// Helper Getters 
// These abstract away the getAttribute call for cleaner code elsewhere.
function getPlace(state)     { return (getAttribute(state, ATTRIBUTE_PLACE)); }
function getProject(state)   { return (getAttribute(state, ATTRIBUTE_PROJECT)); }
function getParams(state)    { return (getAttribute(state, ATTRIBUTE_PARAMS)); }
function getUser(state)      { return (getAttribute(state, ATTRIBUTE_USER)); }
function getGarden(state)    { return (getAttribute(state, ATTRIBUTE_GARDEN)); }
function getComponent(state) { return (getAttribute(state, ATTRIBUTE_COMPONENT)); }
function getPlantId(state)   { return (getAttribute(state, ATTRIBUTE_PLANTID)); }
function getPlantName(state) { return (getAttribute(state, ATTRIBUTE_PLANTNAME)); }

// Helper Setters (Optional but Recommended) ---
// Remember to reassign the result of these functions back to 'applicationState'
// in your main application logic.
function setPlace(state, value)      { return (setAttribute(state, ATTRIBUTE_PLACE, value)); }
function setProject(state, value)    { return (setAttribute(state, ATTRIBUTE_PROJECT, value)); }
function setParams(state, value)     { return (setAttribute(state, ATTRIBUTE_PARAMS, value)); }
function setUser(state, value)       { return (setAttribute(state, ATTRIBUTE_USER, value)); }
function setGarden(state, value)     { return (setAttribute(state, ATTRIBUTE_GARDEN, value)); }
function setComponent(state, value)  { return (setAttribute(state, ATTRIBUTE_COMPONENT, value)); }
function setPlantId(state, value)    { return (setAttribute(state, ATTRIBUTE_PLANTID, value)); }
function setPlantName(state, value)  { return (setAttribute(state, ATTRIBUTE_PLANTNAME, value)); }

// --- Example Usage ---
/*
console.log(getPlantName(applicationState)); // Output: Rose

// Update the state (CRITICAL: remember reassignment!)
applicationState = setPlantName(applicationState, 'Tulip'); 
applicationState = setPlace(applicationState, 'Bedroom');

console.log(getPlantName(applicationState)); // Output: Tulip
console.log(getPlace(applicationState));     // Output: Bedroom
console.log(applicationState);               // View the full, updated state object
*/
