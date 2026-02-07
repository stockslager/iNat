class ObservationsData {
  
  constructor(all_obs, total_results, api_params) {
     this.api_params             = api_params;
     this.per_page               = 200;
     this.max_pages              = 5;
     this.max_rows               = 1000;
     this.total_results          = 0;
       
     this.observations = [];
  }  
}

class Observation {
  
  constructor(rec) {
     this.id                          = rec.id;
    
     if( rec.taxon ){
         this.taxon_id                    = rec.taxon.id;
         this.taxon_name                  = rec.taxon.name || '';
         this.taxon_preferred_common_name = rec.taxon.preferred_common_name || '';
         this.taxon_min_species_ancestry  = rec.taxon.min_species_ancestry || '';

         if( rec.taxon.default_photo ){
             if( rec.taxon.default_photo.url ){
                 this.taxon_default_photo_url = rec.taxon.default_photo.url;
             } 
         }  
     }
       
     if( rec.photos && rec.photos.length>0 ) {
         this.photos_url = rec.photos[0].url || '';
     } else {
         this.photos_url = '';
     }
       
     this.user_icon                   = rec.user.icon || '';
     this.user_login                  = rec.user.login || '';
       

     this.ofvs = [];
       
     if( rec.ofvs && rec.ofvs.length>0 ) {
         for( let i=0; i<rec.ofvs.length; i++ ) {
              const obs_field = new ObsField(rec.ofvs[i]);
              this.ofvs.push(obs_field);
         }
     }
  }  
}

class ObsField {
  
  constructor(obs_field) {
     this.field_id         = obs_field.field_id;
     this.name             = obs_field.name.toLowerCase();
     this.value            = obs_field.value.toLowerCase();
     this.datatype         = obs_field.datatype;

     if( obs_field.taxon ) {
         this.taxon_id                    = obs_field.taxon.id;
         this.taxon_name                  = obs_field.taxon.name || '';
         this.taxon_preferred_common_name = obs_field.taxon.preferred_common_name || '';
         this.taxon_iconic_taxon_id       = obs_field.taxon.iconic_taxon_id || '';
         this.taxon_min_species_ancestry  = obs_field.taxon.min_species_ancestry || '';
     }
  }    
}
