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


// Fetches data from a URL and parses it as JSON.
// Throws an error for non-OK HTTP statuses or network issues.
// @param {string} url The URL to fetch.
// @returns {Promise<object>} A promise that resolves to the JSON data.
async function apiFetch(url) {
    try {
        const response = await fetch(url);

        if (!response.ok) {
            // This error will be caught by the local catch block or the caller's catch
            throw new Error(`${response.status} (${response.statusText}) returned from ${response.url}`);
        }

        // This can also throw an error if the data is not valid JSON
        const data = await response.json(); 
        
        return data; // Implicitly returns a resolved Promise with the data

    } catch (err) {
        console.error("Fetch error:", err.message);
        // Re-throw the error so the calling code must also handle it
        throw err; 
    }
}
