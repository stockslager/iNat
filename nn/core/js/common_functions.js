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
const CONST_SPECIES        = 'species:';
const CONST_OBSERVATIONS   = 'observations:';
const CONST_OF             = ' of ';
const CONST_ABOUT          = 'About';

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
const CONST_NPC_UTF8       = '&#128101;';
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
        if (key === 'style' && typeof value === 'object') {
           Object.assign(eobj.style, value); 
        } else if (key === 'innerHTML' || key === 'html') {
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

function faddelems(etype,eparent=null,eattributes=[]) { for (let e of eattributes) { faddelem(etype,eparent,e); }; };

function replaceDoubleQuotes(str) { return str.replace(/"/g, '%22'); }

function capitalizeWords(str) {
  return str.toLowerCase().split(' ').map(function(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

function buildNavHome( navbar, baseUrl, homeState ) {
    let homeUrl = baseUrl + buildParameterList(homeState);
    let homeDiv = faddelem('div', navbar, { id: 'home' });
    let hLink = faddelem('a', homeDiv, { href: homeUrl });
    faddelem('span', hLink, { innerHTML: CONST_LEAF_UTF8 });
}

function buildNavAbout( navbar, baseUrl, homeState ) {
    let homeUrl = baseUrl + buildParameterList(homeState);
    let homeDiv = faddelem('div', navbar, { id: 'home' });
    let hLink = faddelem('a', homeDiv, { href: homeUrl });
    faddelem('span', hLink, { textContent: CONST_ABOUT });
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

    buildNavDDShow( navbar, dd_name, results, config, baseUrl, sub_taxon_arr );
}

function buildNavDDShow( navbar, dd_name, results, config, baseUrl, sub_taxon_arr ) {

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
             // there will be no sub_taxon_arr if we aren't filtering
             // if sub_taxon_arr is null build the show link since we aren't filtering
             // if we ARE filtering, make sure the filtered array includes the taxonId from the config
             if( !sub_taxon_arr || sub_taxon_arr.includes(config.subIcons[j].taxonId) ) {
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

//***************************************************************
// renders the buildHeader section immediately below the navbar *
//***************************************************************
function buildHeader(entity, total, per_page, page_curr, page_max, title_1, title_2, title_3) {
    const container = document.createElement('div');
    container.className = 'rl-box-bar';

    // Left Side Box
    const lboxDiv = document.createElement('div');
    lboxDiv.id = 'lbox';
    const tableLeft = document.createElement('table');
    tableLeft.className = 'tableboxkey';

    let x_of_y = page_curr + CONST_OF + page_max;

    const rows = [
        [entity, total],
        ['per page:', per_page],
        ['page:', x_of_y]
    ];

    rows.forEach(([label, val]) => {
        const tr = document.createElement('tr');
        tr.className = 'trboxes';
        
        const tdL = document.createElement('td');
        tdL.className = 'tdleft';
        tdL.textContent = label; // Safe from injection
        
        const tdR = document.createElement('td');
        tdR.className = 'tdrightbox';
        tdR.textContent = val;   // Safe from injection
        
        tr.append(tdL, tdR);
        tableLeft.appendChild(tr);
    });
    lboxDiv.appendChild(tableLeft);

    // Right Side: Titles (Always 3 rows)
    const rightDiv = document.createElement('div');
    rightDiv.id = 'upperright';
    const tableRight = document.createElement('table');
    tableRight.className = 'tableboxkey';

    // We iterate through all three, even if title_1 or title_2 are null
    [title_1, title_2, title_3].forEach((content) => {
        const tr = document.createElement('tr');
        tr.className = 'trboxes';
        const td = document.createElement('td');
        td.className = 'tdrightbox2';

        if (!content || content === '') {
            // Use a non-breaking space to maintain row height
            td.innerHTML = '&nbsp;'; 
        } else if (typeof content === 'string') {
            // If it looks like HTML (contains < >), use innerHTML
            // Otherwise, use textContent for maximum security
            if (content.includes('<') && content.includes('>')) {
                td.innerHTML = content; 
            } else {
                td.textContent = content;
            }
        } else if (content instanceof HTMLElement) {
            // If it's already a DOM element object
            td.appendChild(content);
        }

        tr.appendChild(td);
        tableRight.appendChild(tr);
    });
    rightDiv.appendChild(tableRight);

    container.append(lboxDiv, rightDiv);
    return container;
}

// wrapper around buildHeader
function renderHeader(entity, total, per_page, page_curr, page_max, title_1, title_2, title_3) {
    let headerElem = buildHeader( entity, total, per_page, page_curr, page_max, title_1, title_2, title_3 );
    // Create the wrapper <p> and append the DOM object directly
    const pWrapper = document.createElement('p');
    pWrapper.appendChild(headerElem);
    document.body.appendChild(pWrapper);
}

//**************************************
// Species Counts Table Column Helpers *
//**************************************
// Species Counts Table Column - Photo
function buildSpeciesPhoto( brow, rec ) {
    let tdPhoto = faddelem('td', brow);
    
    if( rec.taxon && rec.taxon.default_photo ) {
        faddelem('img', tdPhoto, { className: 'icon', src: rec.taxon.default_photo.square_url });
    } else {
        faddelem('div', tdPhoto, { className: 'clipart', html: '&#127807;' });
    }
}

// Species Counts Table Column - Name
function buildSpeciesName( brow, rec, url ) {
    let tdName = faddelem('td', brow);
    let a = faddelem('a', tdName, { href: url });
    
    // Common Name 
    faddelem('span', a, { style: { fontSize: 'larger' }, textContent: (rec.taxon.preferred_common_name || '').toLowerCase() });
    
    // Scientific Name 
    let br = faddelem('br', a);
    faddelem('span', a, { style: { fontStyle: 'italic' }, textContent: '(' + (rec.taxon.name || '') + ')' });
}
