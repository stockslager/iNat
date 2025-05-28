function getHomeOpts( winurlparams ) {
  let home_opts = '';

  if( p_project_id ) {
      home_opts = '?project_id='+p_project_id;
      if( p_taxon_id ) {
          home_opts += '&taxon_id='+p_taxon_id;
      }
  } else {
      home_opts = '?taxon_id='+p_taxon_id;
  }
  if( p_params ) {
      home_opts += '&params='+p_params;
  }

  return home_opts;
}
