function getHomeOpts( winurlparams ) {
   let opts='';
   // build param list for url's used in fresults
   for( const [key, value] of winurlparams.entries() ) { 
        if( key !== 'taxon_id' && !key.startWith('field:') ) {
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
   } 
   return( opts );
}
