// default the place to hamilton county and store in the session for 
// use by the tables.
window.sessionStorage.setItem('place_id', '3059');   // hamilton county, oh

// if userId is passed in, set it in the session for use filtering on other tables.
// passing in a userId *might* cause filtration issues on future tables but the 
// assumption is they can pass in custom g_list and s_list along with userId.
window.sessionStorage.setItem('user_id', winurlparams.get('user_id') || '');
   
//let p_per_page = winurlparams.get('per_page') || 200;
//let p_page = winurlparams.get('page') || 1;
let g_list = winurlparams.get('g_list') || '';
let s_list = winurlparams.get('s_list') || '';
let view = winurlparams.get('view') || '';

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
};
function faddelems(etype,eparent=null,eattributes=[]) { for (let e of eattributes) { faddelem(etype,eparent,e); }; };
function fpageurl(urlbase,urlparams,per_page,page) {
   let params = new URLSearchParams(urlparams);
   let url_per_page = params.get('per_page');
   let url_page = params.get('page');
   (url_per_page===null) ? params.append('per_page',per_page) : params.set('per_page',per_page);
   (url_page===null) ? params.append('page',page) : params.set('page',page);
   return urlbase+'?'+params;
};
function fpageurlplusorderbyid(urlbase,urlparams,per_page,page) {
   let params = new URLSearchParams(urlparams);
   params.get('order_by') ? params.set('order_by','id') : params.append('order_by','id');
   return fpageurl(urlbase,params,per_page,page);
};
function ffetch(url) {
   return fetch(url)
   .then((response) => {
      if (!response.ok) { throw new Error(response.status+': '+response.statusText); };
      return response.json();
   })
   .catch((err) => { console.error(err); });
};
function truncate(str, maxLength) {
  if (str.length <= maxLength) {
    return str;
  } else {
     return (str.substring(0, maxLength) + '...');
  }
};
function setupLists(str){
   let list = '';
   if( str === 152539 || str === 22501) {          // rewild or biodiversity of indiana
      list += '&g_list=4484313';
      list += '&s_list=4484172';
   } else if ( str === 145049 ){   // life at nku
      list += '&g_list=4485180';
      list += '&s_list=4485179';
      if( view === '' ){
         list += '&view=nectaring';
      }
   } else if ( str === 221779 ){   // glenwood gardens
      list += '&g_list=4484950';
      list += '&s_list=4484949';
      if( view === '' ){
         list += '&view=nectaring';
      }
   } 

   if( view != '' ){
      list += '&view='+view;
   }
   // if it falls through it returns an empty list for cnc poll garden.
   return list;
};
function fresults(xobj) {
   let results = xobj.results;
   if (results) {
      let total_results = xobj.total_results;
      let per_page = xobj.per_page;
      let page_curr = xobj.page;
      let page_max = Math.ceil(total_results/per_page);
      let page_prev = ((page_curr>1)?page_curr-1:null);
      let page_next = ((page_curr<page_max)?page_curr+1:null);

      faddelem('p',document.body,{innerHTML:'total projects: '+fcomnum(total_results)+'<br />' 
         +'per page: '+fcomnum(per_page)+'<br />'
         +'page: '+fcomnum(page_curr)+' of '+fcomnum(page_max)+'<br />'
         });

      let table = faddelem('table',document.body,{id:'main'});
      let thead = faddelem('thead',table);
      let hrow = faddelem('tr',thead);
      let labels = [
         {innerText:'Icon'},
         {innerText:'Title'},
         {innerText:'Description'},
      ];
      faddelems('th',hrow,labels);
      
      let tbody = faddelem('tbody',table);
      for (let i=0; i<results.length; i++) {
         let target_url = '';     
         let brow = faddelem('tr',tbody);
         let rec = results[i];
         let longText = rec.description||'';
         let truncatedText = truncate(longText, 500);
         let lists = '';

         lists += setupLists(rec.id);
         lists += '&project_title=' + rec.title||'';
         
         if( rec.id === 220623 ){
            target_url += 'https://stockslager.github.io/iNat/cnc_plants_visited.html';
         } else {
            window.session
            target_url += 'https://stockslager.github.io/iNat/glist.html?project_id='+rec.id+lists;
         } 
         
         let values = [
            {innerHTML:'<img class="photo" src="'+((rec.icon)?rec.icon:'')+'" />'},
            {innerHTML:furl(target_url, (rec.title||'no title'))},
            {innerText:truncatedText},
         ];
         faddelems('td',brow,values);
      };

      // buttons to go to prev or next page
      let nav = faddelem('div',document.body,{id:'nav'});
      (page_curr<=1)?faddelem('span',nav,{classList:'button_inactive',title:'already on first page',innerHTML:'&laquo'}):faddelem('a',nav,{classList:'button',title:'first page',id:'button_first',innerHTML:'&laquo',href:fpageurl(winurlexsearchstr,winurlparams,per_page,1)});
      (page_prev===null)?faddelem('span',nav,{classList:'button_inactive',title:'no previous page',innerHTML:'&#8249'}):faddelem('a',nav,{classList:'button',title:'previous page',id:'button_prev',innerHTML:'&#8249',href:fpageurl(winurlexsearchstr,winurlparams,per_page,page_prev)});
      (page_next===null)?faddelem('span',nav,{classList:'button_inactive',title:'no next page',innerHTML:'&#8250'}):faddelem('a',nav,{classList:'button',title:'next page',id:'button_next',innerHTML:'&#8250',href:fpageurl(winurlexsearchstr,winurlparams,per_page,page_next)});
      (page_curr>=page_max)?faddelem('span',nav,{classList:'button_inactive',title:'already on last page',innerHTML:'&raquo'}):faddelem('a',nav,{classList:'button',title:'last page',id:'button_last',innerHTML:'&raquo',href:fpageurl(winurlexsearchstr,winurlparams,per_page,page_max)});
   }
   else { faddelem('p',document.body,{innerText:'No results returned.'}); };
};
let apibase = 'https://api.inaturalist.org/v1/projects';
let apiurl = apibase+((winurlparams!='')?('?'+winurlparams):'');
let apirefurl = 'https://api.inaturalist.org/v1/docs/#!/Projects/get_projects';
let apirefname = 'What\'s Visiting?';
let apiref = furl(apirefurl,apirefname);
faddelem('h2',document.body,{innerText:apirefname});

faddelem('p',document.body,{innerHTML:'To see what\'s visiting the plants in each garden.'});

fetch(apiurl)
   .then((response) => {
      if (!response.ok) { throw new Error(response.status+' ('+response.statusText+') returned from '+response.url); };
      return response.json();
   })
   .then((data) => { fresults(data); })
   .catch((err) => {
      console.error(err.message);
      faddelem('p',document.body,{innerText:'There was a problem retrieving data. Error '+err.message+'.'});
});
