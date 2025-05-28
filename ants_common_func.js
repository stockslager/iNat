function getHomeOpts( winurlparams ) {
  let home_opts = '';

  let p_project_id = winurlparams.get('project_id') || '';
  let p_taxon_id   = winurlparams.get('taxon_id') || ''; 
  let p_params     = winurlparams.get('params') || '';
  let p_place_id   = winurlparams.get('place_id') || '';

  if( p_project_id ) {
      home_opts = '?project_id='+p_project_id;
      if( p_taxon_id ) {
          home_opts += '&taxon_id='+p_taxon_id;
      }
  } else {
      home_opts = '?taxon_id='+p_taxon_id;
  }
  
  if( p_params )      { home_opts += '&params='+p_params; }
  if( p_place_id )    { home_opts += '&place_id='+p_place_id; }

  return home_opts;
}
