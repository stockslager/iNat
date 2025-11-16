function hasFieldValueThatMatchesMergedValue( rec ) {
 
  for( let i=0; i<rec.ofvs.length; i++ ) {
       if( field_array.includes(rec.ofvs[i].field_id.toString() ) ) {
           if( rec.ofvs[i].datatype === 'taxon' && rec.ofvs[i].taxon_id ) {
               if( isNaN(rec.ofvs[i].value) ) {  // needed to handle case where type taxon has plain text value
                   if( p_field_value.toLowerCase().toString() === rec.ofvs[i].value.toLowerCase().toString() ) {
                       return true;
                   }
               } else {
                   const ofvs_ancestry_arr = rec.ofvs[i].taxon.min_species_ancestry.split(','); 
                   if( ofvs_ancestry_arr.includes(p_field_value.toString()) ) {
                       return true;
                   }
               }
           } else {
               if( p_field_value.toLowerCase().toString() === rec.ofvs[i].value.toLowerCase().toString() ) {
                   return true;
               }
           }
       }
   }
 
}

function hasMatchingFieldValue( rec ) {
 
  if( p_operator === 'merge' ) {
      return hasFieldValueThatMatchesMergedValue(rec);
  }
 
  for( let i=0; i<rec.ofvs.length; i++ ) {
       if( field_array.includes(rec.ofvs[i].field_id.toString() ) ) {
           if( rec.ofvs[i].field_id.toString() === p_field.toString() ) {
               if( rec.ofvs[i].datatype === 'taxon' && rec.ofvs[i].taxon_id ) {
                   if( isNaN(rec.ofvs[i].value) ) {  // needed to handle case where type taxon has plain text value
                       if( p_field_value.toLowerCase().toString() === rec.ofvs[i].value.toLowerCase().toString() ) {
                           return true;
                       }
                   } else {
                       const ofvs_ancestry_arr = rec.ofvs[i].taxon.min_species_ancestry.split(','); 
                       if( ofvs_ancestry_arr.includes(p_field_value.toString()) ) {
                           return true;
                       }
                   }
               } else {
                   if( p_field_value.toLowerCase().toString() === rec.ofvs[i].value.toLowerCase().toString() ) {
                       return true;
                   }
               }
           }
       }
   }
 
}

function showRow( rec ) {
 
    // if &obs_fields were passed in but none of the p_obs_fields match 
    //any of the observation fields on the observation, skip it.
    if( p_obs_fields ) {
        let matchFound = false;
        for( let i=0; i<rec.ofvs.length; i++ ) {
             if( field_array.includes( rec.ofvs[i].field_id.toString() ) ) {
                 matchFound = true;
                 break;
             }
        }

        if( !matchFound ) {
            return false;
        }
    }
 
    if( p_chosen_taxon_id ) {
        const ancestry_arr = rec.taxon.min_species_ancestry.split(','); 
        if( p_chosen_taxon_id.toString() === rec.taxon.id.toString() || ancestry_arr.includes( p_chosen_taxon_id.toString() )  ) {
            if( p_field_value ) {
                return hasMatchingFieldValue(rec);
            } else {
                return true;
            }
        }
    } else if( p_field_value ) {
            return hasMatchingFieldValue(rec);
    } else {
        return true;
    }
}

function buildEmptyLink() {
      winurlparams.delete('operator');
      winurlparams.delete('obs_fields');
      winurlparams.delete('chosen_taxon_id');
      winurlparams.delete('field_value');
      winurlparams.delete('field');
      let empty_link = furl(window.location.protocol+'?'+winurlparams,'&#9447;');
      if( p_operator )        { winurlparams.append('operator', p_operator); }
      if( p_obs_fields )      { winurlparams.append('obs_fields', p_obs_fields); }
      if( p_chosen_taxon_id ) { winurlparams.append('chosen_taxon_id', p_chosen_taxon_id); }
      if( p_field_value )     { winurlparams.append('field_value', p_field_value); }
      if( p_field )           { winurlparams.append('field', p_field); } 

      return empty_link;
}

function getTaxonName( configuration, taxon_id ) {
   let taxon_name = 'Plant';

   for( let i=0; i<configuration.taxa.length; i++ ) {
        if( taxon_id === configuration.taxa[i].taxon_id ) {
            taxon_name = configuration.taxa[i].taxon_name;
        }
   }
   return taxon_name;
}

function buildMenu() {
      let menu_string = '';
      let links = '';

      menu_string = '<div class="navbar">';

      if( configuration.taxa && configuration.taxa.length > 0 ) {
          links += furl(window.location.protocol+'?'+winurlparams,'All');
          for( let i=0; i<configuration.taxa.length; i++ ) {
               winurlparams.delete('field_value');
               winurlparams.delete('field');
               links += furl(window.location.protocol+'?'+winurlparams+'&field_value='+configuration.taxa[i].taxon_id,configuration.taxa[i].taxon_name);
               if( p_field_value )     { winurlparams.append('field_value', p_field_value); }
               if( p_field )           { winurlparams.append('field', p_field); } 
          }
      }
 
      if( links ) { menu_string += buildDD(getTaxonName(configuration, p_field_value), links); }

      menu_string += '</div>';

      return menu_string;
}

function fresults(xobj) {
   let box_array = [];
   let display_count = 0;
   let filtered_count = 0;

   let total_results = xobj.total_results;
   let per_page = xobj.per_page;
   let page_curr = xobj.page;
   let page_max = Math.ceil(total_results/per_page);
   let page_prev = ((page_curr>1)?page_curr-1:null);
   let page_next = ((page_curr<page_max)?page_curr+1:null);

   if( p_obs_fields !== '' ){
       field_array = p_obs_fields.split(",");
   }

   let observations = xobj.results;

   for( let f=0; f<field_array.length; f++ ){
        box_array.push(new boxRow(field_array[f], '') );
   }
 
   if( observations ) {

      let labels = [];
      let obs_field_box = '';
      let labelCount = 0;

      let merged = 'observation field';
      labels = [
            {innerText:'#'},
            {innerText:'photo'},
            {innerText:'observation species name'}, 
            {innerText:'obs photo'}];
    
      if( p_operator === 'merge' ){
          merged = 'merged observation field';
      } 

      let tempBrow = [];

      let field_array_copy = field_array;
      for (let i=0; i<observations.length; i++) {
         let rec = observations[i];
         if(rec.ofvs&&rec.ofvs.length>0){
              for( let r=0; r<field_array_copy.length; r++ ) {
                 for( let j=0; j<rec.ofvs.length; j++ ){
                      if( field_array_copy[r] === rec.ofvs[j].field_id.toString() ){
                          let box_row   = box_array.find( boxRow => boxRow.field_id === rec.ofvs[j].field_id.toString() );
                          box_row.field_name = rec.ofvs[j].name.toString();
                      }
                 }
              }
         }
      }
    
      faddelem('p',document.body,{innerHTML:(buildMenu())});  
      
      let firstCol = 'yes';
        
      box_array = box_array.filter(box_array => box_array.field_name !== '');

      if( p_obs_fields ) {
          obs_field_box += '<span id="topright"><span id="mismatch">&#127800; ~ obs field mismatch.</span><span id="dltest"><table id="tablekey">';
          obs_field_box += '<tr id="trkey">';  

          if( p_operator ) {
              obs_field_box += '<td id="key">field id</td>  <td id="key">'+merged+'</td><td id="tdkey"></td><td id="keyx"></td></tr>';
          } else {
              obs_field_box += '<td id="key">field id</td>  <td id="key">'+merged+'</td><td id="tdkey"></td><td id="keyx">'+buildEmptyLink()+'</td></tr>';
          }
    
          for( let e=0; e<box_array.length; e++ ) {
               labelCount++;
               if( box_array[e].field_name !== '' ) {
                   obs_field_box += '<tr id="trkey">';
                   obs_field_box += '<td id="tdkey">'+ box_array[e].field_id + '</td>';
                   obs_field_box += ('<td id="tdsecond">' + box_array[e].field_name.toLowerCase() + '</td></tr>');
                   if( p_operator !== 'merge' ){
                       labels.push({innerText:box_array[e].field_name});
                   } else {
                       if( firstCol === 'yes' ){
                           firstCol = 'no';
                           labels.push({innerText:'merged Fields (see upper right)'});
                       } 
                   }
               } else {
                   obs_field_box += ('<tr id="trkey"><td id="tdkey">' + box_array[e].field_id + '</td>');
                   obs_field_box += ('<td id="tdsecond">missing from this page</td></tr>');
                   if( p_operator !== 'merge' ) {
                       labels.push({innerText:''});
                   }
               }
          }

          obs_field_box += '</table></span></span>';
          faddelem('p',document.body,{innerHTML:obs_field_box});

          // hide the mismatch warning... only display it if there is a mismatch in the table.
          document.getElementById("mismatch").style.display = "none"; 
      }
     
      for (let i=0; i<observations.length; i++) {
         let rec = observations[i];
         let tax_name = '';
         let pref_tax_name = '';
         let tax_photo = '<div class="clipart"></div>'; 
         let tax_id = '';
         let field1 = ''; 
         let displayName = '&nbsp;';
         let displayTaxonName = '';
         let mismatch = '';
         let matchedCopy = 'no';
         let values = [];
         let dataType = '';
         let dataType2 = '';
         let matchValue = '';
         let matchTaxonId = '';
         let taxon = '';
         
         if( rec.taxon.id ){
             tax_id = rec.taxon.id;
             tax_name = rec.taxon.name || '';
             pref_tax_name = rec.taxon.preferred_common_name || '';
           
             if( rec.taxon.default_photo.url ){
                 tax_photo = '<img class="icon" src="'+rec.taxon.default_photo.url+'" />';
             }
         }

         if( tax_id !== '' ) {
             winurlparams.delete('chosen_taxon_id');
             taxon = furl(window.location.protocol+'?'+winurlparams+'&chosen_taxon_id='+tax_id,'<span style=\"font-size:larger\">'+pref_tax_name.toLowerCase()+'</span><span style=\"font-style:italic\"><br>('+tax_name+')</span>');   
             if( p_chosen_taxon_id ) { winurlparams.append('chosen_taxon_id', p_chosen_taxon_id); }
         }

         let obs_photo = '';
         if( rec.photos && rec.photos[0].url ) {  
             obs_photo = rec.photos[0].url;
         }
       
         values = [
                  {innerText:i+1},
                  {innerHTML:tax_photo},
                  {innerHTML:taxon},
                  {innerHTML:furl(root_observations+rec.id,'<img class="mini_photo2" src="'+obs_photo+'" />')},
              ];

         let user_icon = rec.user.icon || '';
         
         if( user_icon === '' ){
            user_icon += '<div class="npcicon"></div>';
         } else {
            user_icon = '<img class="icon" src="'+user_icon+'" />';
         }

         let emojiTitle = 'Merged Observation Fields:&#10;';

         let merge_field = '';
         let merge_field_value = '';
         if(rec.ofvs&&rec.ofvs.length>0){
              for( let r=0; r<box_array.length; r++ ) {
                 for( let j=0; j<rec.ofvs.length; j++ ){

                      if( field_array.includes(rec.ofvs[j].field_id.toString()) ){
                          if( matchValue === '' ){
                              matchValue = rec.ofvs[j].value;
                          } else if( rec.ofvs[j].value !== '' && matchValue !== rec.ofvs[j].value ){
                              mismatch = 'yes';
                          }
                      
                          if( dataType === '' ){
                              dataType = rec.ofvs[j].datatype;
                          } else if( dataType !== rec.ofvs[j].datatype ){
                              mismatch = 'yes';
                          }
                          if( rec.ofvs[j].taxon.id ){
                              if( matchTaxonId === '' ){
                                  matchTaxonId = rec.ofvs[j].taxon.id;
                              }
                              if( rec.ofvs[j].taxon.id !== matchTaxonId ){
                                  mismatch = 'yes';
                              }
                          }
                      } 

                      if( p_operator === 'merge' && rec.ofvs[j].field_id.toString() === box_array[r].field_id.toString() ){
                          
                          field1 = rec.ofvs[j].value.toLowerCase();

                          if( rec.ofvs[j].taxon.id ){ 
                              let name  = rec.ofvs[j].taxon.name || '';
                              let cname = rec.ofvs[j].taxon.preferred_common_name || '';
                              if( p_ofield_iconic === '' || p_ofield_iconic === rec.ofvs[j].taxon.iconic_taxon_id.toString() ){
                                  field1 = name;
                                  displayCommonName = cname.toLowerCase();
                                  displayTaxonName = name;
                                  merge_field = rec.ofvs[j].field_id;
                                  merge_field_value = rec.ofvs[j].value.toLowerCase();
                                  displayName = '<span style="font-size:larger">'+cname.toLowerCase()+'</span><span style="font-style:italic"><br>('+name+')</span>';
                                  emojiTitle    += (rec.ofvs[j].field_id + ' ' + name + '&#10;');
                              } else { 
                                  emojiTitle    += (rec.ofvs[j].field_id + ' ' + name.toLowerCase() + '&#10;');
                                  displayName = '';
                              }
                          } else {
                                  if( rec.ofvs[j].value.toLowerCase() !== 'unknown' ){
                                      merge_field = rec.ofvs[j].field_id;
                                      merge_field_value = rec.ofvs[j].value.toLowerCase();
                                      displayName    = rec.ofvs[j].value.toLowerCase();
                                  }
                                  emojiTitle    += (rec.ofvs[j].field_id + ' ' + rec.ofvs[j].value.toLowerCase() + '&#10;');
                          }
                      }

                      if( p_operator !== 'merge' ) {
                          if( rec.ofvs[j].field_id.toString() === box_array[r].field_id.toString() ){
                              matchedCopy = 'yes';
                              if( rec.ofvs[j].value ) {
                                  field1 = rec.ofvs[j].value.toLowerCase();
                                  displayName = rec.ofvs[j].value.toLowerCase();
                                
                                  if( rec.ofvs[j].taxon.id ){
                                      let name  = rec.ofvs[j].taxon.name || '';
                                      let cname = rec.ofvs[j].taxon.preferred_common_name || '';
                                      field1 = '<span style="font-size:larger">'+cname.toLowerCase()+'</span><span style="font-style:italic"><br>('+name+')</span>';
                                  }
                                  if( p_field_value === '' ){
                                      winurlparams.delete('field_value');
                                      winurlparams.append('field_value', rec.ofvs[j].value.toLowerCase());
                                      winurlparams.delete('field');
                                      winurlparams.append('field', rec.ofvs[j].field_id);
                                      values.push({innerHTML:furl(window.location.protocol+'?'+winurlparams, field1)});
                                      winurlparams.delete('field_value');
                                      winurlparams.delete('field');
                                      if( p_field_value ) { 
                                          winurlparams.append('field', p_field);
                                          winurlparams.append('field_value', p_field_value); 
                                      }
                                  } else {
                                      values.push({innerHTML:field1});
                                  }
                              } else {
                                  values.push({innerText:''});
                              }
                          }
                      }
                  }
                 if( p_operator !== 'merge' ){
                 if( matchedCopy === 'yes' ){
                     matchedCopy = 'no';
                 } else {
                     values.push({innerText:''});
                 }
                 }
             }
         }             
       
         if( p_operator === 'merge' ){
              if( displayTaxonName !== '' ){
                  if( mismatch === 'yes' ){
                      document.getElementById("mismatch").style.display = "inline"; 
                      displayName = '<span style="font-size:larger">'+displayCommonName.toLowerCase()+'</span><span style="font-style:italic"><br>('+displayTaxonName+') <span class="flowericon" title="'+emojiTitle+'">&#x1F338;</span></span>';
                  } else {
                      displayName = '<span style="font-size:larger">'+displayCommonName.toLowerCase()+'</span><span style="font-style:italic"><br>('+displayTaxonName+')</span>';
                  }
              } else {
                  if( mismatch === 'yes' ){
                      document.getElementById("mismatch").style.display = "inline"; 
                      displayName += ' ';
                      displayName += '<span class="flowericon" title="'+emojiTitle+'">&#x1F338;</span></span>';    
                  } 
              }
              winurlparams.delete('field_value');
              winurlparams.append('field_value', merge_field_value);
              winurlparams.delete('field');
              winurlparams.append('field', merge_field);
              values.push({innerHTML:furl(window.location.protocol+'?'+winurlparams,displayName)});
              winurlparams.delete('field_value');
              winurlparams.delete('field');
              if( p_field_value ) { 
                  winurlparams.append('field', p_field);
                  winurlparams.append('field_value', p_field_value); 
              }
         }          

         values.push({innerHTML:user_icon});
         values.push({innerHTML:furl(root_people+rec.user.login,rec.user.login)}); 

         if( showRow(rec) ) {
             display_count++;
             tempBrow.push(values);
         } else {
             filtered_count++;
         }
      }; 

      winurlparams.delete('chosen_taxon_id');
      winurlparams.delete('field_value');
      winurlparams.delete('field');
      faddelem('p',document.body,{innerHTML:'<span id="stats"><table id="tablekey">' +
                                            '<tr id="trkey"><td id="tdkey">dataset:</td><td id="tdright">'    + total_results  + '</td><td id="tdkey"></td><td id="tdright">' + furl(window.location.protocol+'?'+winurlparams,'reset') + '</td></tr>' + 
                                            '<tr id="trkey"><td id="tdkey">displayed:</td><td id="tdright">'  + display_count  + '</td></tr>' + 
                                            '<tr id="trkey"><td id="tdkey">hidden:</td><td id="tdright">'     + filtered_count + '</td></tr></table></span>'});
      if( p_chosen_taxon_id ) { winurlparams.append('chosen_taxon_id', p_chosen_taxon_id); }
      if( p_field_value )     { winurlparams.append('field_value', p_field_value); }
      if( p_field )           { winurlparams.append('field', p_field); }
    
      let table = faddelem('table',document.body,{id:'main'});
      let thead = faddelem('thead',table);
      let hrow  = faddelem('tr',thead);

      labels.push({innerText:'user photo'});
      labels.push({innerText:'user login'});
      
      faddelems('th',hrow,labels);

      let tbody = faddelem('tbody',table);
    
      // loop through array of rows stored on object.
      for( let q=0; q<tempBrow.length; q++ ){
           let brow = faddelem('tr',tbody);
           faddelems('td',brow,tempBrow[q]);
      }
    
   } else { 
      faddelem('p',document.body,{innerText:'No results returned.'}); 
   }; 
};
