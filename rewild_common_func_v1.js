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
