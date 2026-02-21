// root directory for inat observations
const root_observations = 'https://www.inaturalist.org/observations/';
const root_people       = 'https://www.inaturalist.org/people/';
const root_obs_fields   = 'https://www.inaturalist.org/observation_fields/';
const root_projects     = 'https://www.inaturalist.org/projects/';
const root_taxa         = 'https://www.inaturalist.org/taxa/';
const root_places       = 'https://www.inaturalist.org/places/';

// repo root directory
const github_root = 'https://stockslager.github.io/iNat/';

// json root dir
const json_root = 'https://stockslager.github.io/iNat/nn/core/json/';

// JavaScript root dir 
const js_root = 'https://stockslager.github.io/iNat/nn/core/js/';

// outlinks used in cncnpc_seeds_fields.html
// usda outlink 
// missour botanical garden outlink 
const root_usda = 'https://plants.usda.gov/plant-profile/';
const root_missouri = 'https://www.missouribotanicalgarden.org/PlantFinder/PlantFinderDetails.aspx?kempercode=';

// global constants...
const CONST_TOTAL_SPECIES  = 'total species: ';  // common api results header
const CONST_TOTAL_OBS      = 'total observations: ';
const CONST_PAGE           = 'page: ';           // common api results header 
const CONST_PER_PAGE       = 'per page: ';       // common api results header
const CONST_ON             = 'On ';
const CONST_ALL_PLANTS     = 'All Plants';

// show menu
const CONST_ALL            = 'all';              // common show drop down label
const CONST_SHOW           = 'Show';             // common show drop down title
const CONST_PLACE          = 'Place';            // common place drop down title

// show menu and home utf 8's
const CONST_PLUS_UTF8      = '&#10133;'          // plus symbol for show drop down
const CONST_SUNFLOWER_UTF8 = '&#127803;'         // sunflower icon for garden list
const CONST_LEAF_UTF8      = '&#127807;';        // leaf icon for yard list
const CONST_SEEDLING_UTF8  = '&#x1F331;';        // seedling icon
const CONST_BOOT_UTF8      = '<span style="font-size: 18px;">&#x1F97E;</span>';        // back icon for thru hiker
const CONST_NPC_UTF8       = '&#128100;';        // npc icon for observers
const CONST_ART_UTF8       = '&#127912;';        // pallete icon for journaling / artwork
const CONST_ANIMALS_UTF8   = '&#128038;';        // bird
const CONST_STUDIES_UTF8   = '&#127891;';

// iNat api per_page (number of rows per_page requested from api)...
const CONST_OBSERVATIONS_PER_PAGE           = '100';
const CONST_SPECIES_COUNTS_PER_PAGE         = '100';
const CONST_OBSERVATIONS_OBSERVERS_PER_PAGE = '100';
function fcomnum(n) { return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g,',') }; 

// SECURE: Uses textContent to prevent script injection in link text
function furl(url, txt = url) {
    const a = document.createElement('a');
    const safeUrl = (url.trim().toLowerCase().startsWith('javascript:')) ? '#' : url;
    a.href = safeUrl;
    a.textContent = txt; 
    return a;
}

function faddelem(etype, eparent = null, eattributes = {}) {
    const eobj = document.createElement(etype);
    for (let [key, value] of Object.entries(eattributes)) {
        if (key === 'innerHTML') {
            //console.warn("innerHTML used; ensure content is sanitized.");
            eobj.innerHTML = value;
        } else if (key === 'textContent') {
            eobj.textContent = value;
        } else {
            eobj[key] = value;
        }
    }
    if (eparent) eparent.appendChild(eobj);
    return eobj;
}

function replaceDoubleQuotes(str) { return str.replace(/"/g, '%22'); }

function capitalizeWords(str) {
  return str.toLowerCase().split(' ').map(function(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

function buildNavHome( navbar, baseUrl, homeState ) {
    let homeUrl = './garden_list.html' + buildParameterList(homeState);
    let homeDiv = faddelem('div', navbar, { id: 'home' });
    let hLink = faddelem('a', homeDiv, { href: homeUrl });
    faddelem('span', hLink, { innerHTML: CONST_LEAF_UTF8 });
}

function buildNavDDFilteredShow( navbar, dd_name, results, config, baseUrl ) {

    // Get the raw string from the URL
    let raw_taxon_str = getTaxonDD(appState) || ""; 
    
    // CLEANER: Split by comma and keep ONLY items that are in your config.json
    // This deletes anything injected into the dd url param by the user.
    let sub_taxon_arr = raw_taxon_str.split(',').filter(id => {
        return config.subIcons.some(iconObj => iconObj.taxonId.toString() === id.trim());
    });

    // Force the appState to only have the clean IDs
    appState = setTaxonDD(appState, sub_taxon_arr.join(','));
 
    sub_taxon_arr = getTaxonDD(appState) || [];
 
    if( getTaxonDD(appState) ) {
        sub_taxon_arr = getTaxonDD(appState);
    } else {
        if( config.subIcons ) {
            for( let i=0; i<results.length; i++) {
                 if( !sub_taxon_arr.includes(results[i].taxon.id.toString()) ) {
                     for( let j=0; j<config.subIcons.length; j++ ) {
                          for( let k=0; k<results[i].taxon.ancestor_ids.length; k++ ) {
                               if( results[i].taxon.ancestor_ids[k].toString() === config.subIcons[j].taxonId.toString() ){
                                   if( !sub_taxon_arr.includes( config.subIcons[j].taxonId ) ) {
                                       sub_taxon_arr.push( config.subIcons[j].taxonId );
                                   }
                               }
                           }
                      }
                 }
             }
             // add the comma delimited list of taxons to the url params
             // so the full list can still be shown during filtration.
             appState = setTaxonDD(appState, sub_taxon_arr.join());
        }
    } 

    // Build the Show Dropdown
    if( config.subIcons ) {
        let urlState = appState;
        urlState = setMenuId(urlState, '');
        urlState = setMenuName(urlState, '');
        urlState = setPage(urlState, '1');

        // Create the Dropdown container
        let dropdown = faddelem('div', navbar, { className: 'dropdown' });
       
        // Dropdown Button
        faddelem('button', dropdown, { 
            className: 'dropbtn', 
            textContent: capitalizeWords(dd_name) 
        });

        // Dropdown Content (the links)
        let ddContent = faddelem('div', dropdown, { className: 'dropdown-content' }); 

        // ALL Link
        let allUrl = baseUrl + buildParameterList(urlState);
        let allLink = faddelem('a', ddContent, { href: allUrl });
        // Icon for ALL
        faddelem('span', allLink, { innerHTML: CONST_PLUS_UTF8 });
        // Text for ALL 
        faddelem('span', allLink, { textContent: CONST_ALL }); 

        // Taxon Links Loop
        for( let j = 0; j < config.subIcons.length; j++ ) {
             if( sub_taxon_arr.includes(config.subIcons[j].taxonId) ) {
                 urlState = setMenuId(urlState, config.subIcons[j].taxonId);
                 let iconUrl = baseUrl + buildParameterList(urlState);
                 
                 let tLink = faddelem('a', ddContent, { href: iconUrl });

                 // Taxon Icon if present
                 if( config.subIcons[j].icon ) {
                     faddelem('span', tLink, { innerHTML: config.subIcons[j].icon });
                 }
             
                 // Taxon Name 
                 faddelem('span', tLink, { textContent: config.subIcons[j].name });
             }
        }
    }
}
