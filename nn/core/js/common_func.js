const CONST_SPECIES      = 'species:';
const CONST_OBSERVATIONS = 'observations:';
const CONST_OF           = ' of ';

function fcomnum(n) { return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g,',') }; 
function furl(url,txt=url) { return '<a href="'+url+'">'+txt+'</a>'; };
function faddelem(etype,eparent=null,eattributes={}) { 
   let eobj = document.createElement(etype);
   for (let [key,value] of Object.entries(eattributes)) {
      if ( typeof value === 'object' && value !== null ) {
         for (let [subkey,subvalue] of Object.entries(value)) { eobj[key][subkey] = subvalue; };
      }
      else { eobj[key] = value; };
    };
   if (eparent) { eparent.appendChild(eobj); };
   return eobj;
}

function faddelems(etype,eparent=null,eattributes=[]) { for (let e of eattributes) { faddelem(etype,eparent,e); }; };
function fpageurl(urlbase,urlparams,per_page,page) {
   let params = new URLSearchParams(urlparams);
   let url_per_page = params.get('per_page');
   let url_page = params.get('page');
   (url_per_page===null) ? params.append('per_page',per_page) : params.set('per_page',per_page);
   (url_page===null) ? params.append('page',page) : params.set('page',page);
   return urlbase+'?'+params;
}

function fpageurlplusorderbyid(urlbase,urlparams,per_page,page) {
   let params = new URLSearchParams(urlparams);
   params.get('order_by') ? params.set('order_by','id') : params.append('order_by','id');
   return fpageurl(urlbase,params,per_page,page);
}

function ffetch(url) {
   return fetch(url)
   .then((response) => {
      if (!response.ok) { throw new Error(response.status+': '+response.statusText); };
      return response.json();
   })
   .catch((err) => { console.error(err); });
}

function famp(str) { return str.replace(/&/g,'&amp;'); };
function fshorten(num) { return num<10000 ? num : num<1000000 ? (num/1000).toFixed(1)+'K' : (num/1000000).toFixed(1)+'M'; };
function fdate(str,dateonly=false) {
   str = str.replace(/t/i,' '); //replaces T (case insensitive) with a space
   if (dateonly) { str = str.split(' ')[0]; }
   else {
      str = str.replace(/([+-]\d{2}\:?\d{2})/,' ($1)'); //puts parenthesis around time zone offset
      str = str.replace(/z/i,' (+00:00)'); //replaces Z (case insensitve) with UTC
      str = str.replace('+00:00','±00:00');
   };
   return str;
}

function truncate(str, maxLength) {
  if (str.length <= maxLength) {
    return str;
  } else {
     return (str.substring(0, maxLength) + '...');
  }
}

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '');
}

function isMultipleOfFour(num) {
  return num % 4 === 0;
}

function isMultipleOfThree(num) {
  return num % 3 === 0;
}

function replaceDoubleQuotes(str) {
  return str.replace(/"/g, '%22');
}

function capitalizeWords(str) {
  return str.toLowerCase().split(' ').map(function(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

function boxRow(field_id, field_name, field_value) {
    this.field_id    = field_id;
    this.field_name  = field_name;
}

// functions for menu bar
function buildDD( name, content ) {
  let dd = '<div class="dropdown">' +
                 '<button class="dropbtn">' + name +
                    '<i class="fa fa-caret-down"></i>' +
                 '</button>' +
                    '<div class="dropdown-content">' +
                          content +
                    '</div>' +
           '</div>';

  return( dd );
}

function buildDDTitle( content ) {
  let dd = '<div class="dd_title">' + content +
           '</div>';

  return( dd );
}

function buildMenuURL( url ) {
  let dd = '<div id="menu_title">' + url +     
           '</div>';

  return( dd );
}

function buildHome( url ) {
   return ('<div id="home">'+url+'</div>');
}

function copyOpts( winurlparams ) {
   let opts='';
   // build param list for url's used in fresults
   for( const [key, value] of winurlparams.entries() ) { 
        if( opts === '' ){
            opts += "?";
        } else {
            opts += "&";
        }
        opts += key;
        opts += "=";

        if( key === 'page' ){
            opts += '1';
        } else {
            opts += value;
        }
   } 
   return( opts );
}

function removeItemFromCommaDelimitedList(listString, itemToRemove) {
  // 1. Split the string into an array
  const listArray = listString.split(',').map(item => item.trim()).filter(item => item !== '');

  // 2. Remove the desired item from the array
  const updatedArray = listArray.filter(item => item !== itemToRemove);

  // 3. Join the array back into a comma-delimited string
  const updatedListString = updatedArray.join(',');

  return updatedListString;
}

function buildHeader(entity, total, per_page, page_curr, page_max, title_1, title_2, title_3) {
    const container = document.createElement('div');
    container.className = 'top-bar';

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
