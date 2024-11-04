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
            target_url += 'https://stockslager.github.io/iNat/rewild_plants_visited.html?project_id='+rec.id+lists;
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
faddelem('p',document.body,{innerHTML:'<div style="float:right; padding-left: 20px; padding-right: 20px; padding-top:5px; padding-bottom:10px;">'
  + '<a href="https://stockslager.github.io/iNat/do_what_now.html">help</div></a>'});
faddelem('h2',document.body,{innerText:apirefname});

let rw_g_list = winurlparams.get('g_list') || '';
let rw_s_list = winurlparams.get('s_list') || '';
   
if ( (rw_g_list === '' && rw_s_list != '') || (rw_g_list != '' && rw_s_list === '') ){
   let instructions = [
      {innerHTML:'Custom list missing from url parameters.  If custom species lists are passed in, they both need to be specified.  Please specify both url parameters (<b>&g_list</b> and <b>&s_list</b>).'},
   ];
   faddelem('h2',document.body,{innerText:'Error ~ Invalid URL Parameters'});
   faddelems('p',document.body,instructions);
   throw('');
}

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
