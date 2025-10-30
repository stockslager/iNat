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
     console.log('Obs const...');
       
     this.photos                      = rec.photos || '';
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

  hasFieldNameValuePair( p_field_name, p_field_value ) {

     if( this.ofvs && this.ofvs.length > 0 ) {
         for( let i=0; i<this.ofvs.length; i++ ) {
              if( p_field_name.toString()  === this.ofvs[i].name.toString() &&
                  p_field_value.toString() === this.ofvs[i].field_value.toString() ) {
                  return true;
              }
         }
     }

     return false;
  }
  
  hasFieldName( p_field ) {
     if( this.ofvs && this.ofvs.length > 0 ) {
         for( let i=0; i<this.ofvs.length; i++ ) {
              if( p_field_name.toString()  === this.ofvs[i].name.toString() ) {
                  return true;
              }
         }
     }

     return false;
  }
  
}

class ObsField {
  
  constructor(obs_field) {
     this.field_id         = obs_field.field_id;
     this.name             = obs_field.name;
     this.value            = obs_field.value;
     this.datatype         = obs_field.datatype;
     this.taxon            = obs_field.taxon;

     if( obs_field.taxon ) {
         this.taxon_id                    = obs_field.taxon.id;
         this.taxon_name                  = obs_field.taxon.name || '';
         this.taxon_preferred_common_name = obs_field.taxon.preferred_common_name || '';
         this.taxon_iconic_taxon_id       = obs_field.taxon.iconic_taxon_id || '';
     }
  }    
}
