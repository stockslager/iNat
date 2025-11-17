function buildGrid(data) {

   var results = data.results;
   var recsfound = results ? results.length : 0;
   var obsseq = 0; 
   var grid = faddelem('div',document.body,{id:'grid',style:{height:cellpx+'px',width:cellpx+'px'}});
   for (r=1;r<=rows;r++) {
      for (c=1;c<=columns;c++) { 
         var gcell = faddelem('div',grid,{classList:'gridcell',style:{
            height:cellpx+'px',
            width:cellpx+'px',
            top:((r-1)*cellpx+(r<=1?0:r-1)*spacerpx)+'px',
            left:((c-1)*cellpx+(c<=1?0:c-1)*spacerpx)+'px'
            }});
         if (recsfound===0&&data.total_results===0) { 
            gcell.innerHTML = furl(famp(obsurl),'<span>no<br />data</span>');
            break;
            }
         else if (recsfound===obsseq) {
            if( (fshorten(data.total_results-obsseq)) === 0 ){
               gcell.innerHTML = '<span>+0<br />more</span>';
            } else {
               gcell.innerHTML = furl(famp(obsurl),'<span>+'+(fshorten(data.total_results-obsseq))+'<br />more</span>');
            }
            obsseq = 0;
            if (r===1&&c>1) { grid.style.width = (c*cellpx+(c-1)*spacerpx)+'px'; };
            break;
         }
         else {
            let obs = results[obsseq];
            let photourl = (obs.photos.length>0) ? obs.photos[0].url : null;
            let taxon = obs.taxon?(obs.taxon.preferred_common_name?(obs.taxon.preferred_common_name):obs.taxon.name):'(Unknown Taxon)';
            let user = obs.user.login+((obs.user.name&&obs.user.name!='')?(' ('+obs.user.name+')'):'');
            let obsdt = obs.time_observed_at?fdate(obs.time_observed_at,true):(obs.observed_on||'(Unknown Date)');
            let anchor = faddelem('a',gcell,{href:famp(obsurlbase+'/'+obs.id)});
            let photo = (photourl===null) ? faddelem('span',anchor,{innerText:'❎'})
               : faddelem('img',anchor,{style:{width:cellpx+'px',height:cellpx+'px'},
                  title: taxon + ' observed by ' + user + ' on ' + obsdt,
                  src: ((cellpx<=75) ? photourl
                     : (cellpx<=150) ? photourl.replace('square','small')
                     : photourl.replace('square','medium'))
                  });
            if (r===1&&c>1) { grid.style.width = (c*cellpx+(c-1)*spacerpx)+'px'; };
            obsseq++;
         };
      };
      if (r>1) { grid.style.height = (r*cellpx+(r-1)*spacerpx)+'px'; };
      if (obsseq===0) { break; };
   };
}

function getObservations() {

   if (window.location.search==='') {
      faddelem('p',document.body,{innerHTML:'This is a quick and dirty example of a widget to display iNaturalist observations in a grid. It is based on the '+furl('https://api.inaturalist.org/v1/docs/#!/Observations/get_observations','Observation Search API endpoint')+' and can accept any of the parameters for that endpoint. Additionally, it accepts 4 more parameters that will allow the grid to be customized: columns, rows, cellpx, and spacerpx.'});
      faddelem('p',document.body,{innerHTML:'Suppose the address of this page is '+furl(winurlexsearchstr)+', and you want to see '+furl(famp(apiurlbase+'?taxon_id=3&place_id=9'),'birds in New Mexico')+' in a 3 (high) x 5 (wide) grid where each cell is 75px x 75px and where each cell is separated by a 2px spacer, then you would open '+furl(famp(winurlexsearchstr+'?rows=3&columns=5&cellpx=75&spacerpx=2&taxon_id=3&place_id=9'))+' in your browser.'});
      faddelem('p',document.body,{innerHTML:'Note that the actual size of the image files is 75px x 75px. So setting the cellpx higher than 75 will make the images look blurry. Only the first photo in an observation will be shown, or else ❎ will be shown when an observation has no photos. The last cell in the grid will always be either a "no data" or "more" button. So a 3x5 grid will show only up to 14 observations.'});
   } else {
        fetch(apiurl)
          .then((response) => {
             if (!response.ok) { throw new Error(response.status+' ('+response.statusText+') returned from '+response.url); };
             return response.json();
          })
          .then((data) => { fresults(data); })
          .catch((err) => {
             console.error(err.message);
             faddelem('p',document.body,{innerHTML:'There was a problem retrieving data. Error '+err.message+'.'})
        });
   };
}

async function asyncGetConfigurations() {
   console.log('json ' + json_root+p_params);
   await fetch((json_root+p_params+'.json'))
     .then(response => response.json())
     .then(data => {
      // Access your data here 
      for( let i=0; i<data.configurations.length; i++ ) {
           if( data.configurations[i].insect_project === p_project_id ) {
               interactions = data.configurations[i].interactions;
           }
           if( data.configurations[i].art_project === p_project_id ) {
               configuration = data.configurations[i];
           }
      }
      console.log(data);
   })
     .catch(error => {
      console.error('Error fetching JSON:', error);
   });
}

// need to pull resources from a json file to pass into an api
// so needs to be asynchronous. 
const getConfigurations = async () => {
   asyncGetConfigurations();
}

