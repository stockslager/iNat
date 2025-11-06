function fresults(xobj) {
   let box_array = [];
   let add_array = [];
   let total_results = xobj.total_results;
   let display_count = 0;
   let filtered_count = 0;
   let results = xobj.observations;

   for( let f=0; f<field_array.length; f++ ){
        box_array.push(new boxRow(field_array[f], '') );
   }
 
   if (results) {

      let labels = [];
      let mismatch = '';
      let field_array_copy = field_array;
      let flower = '';
      let dlString = '';
      let labelCount = 0;

      let merged = 'observation field';
      labels = [
            {innerText:'#'},
            {innerText:'photo'},
            {innerText:'name'}, 
            {innerText:'obs photo'}];
    
      if( p_operator === 'merge' ){
          merged = 'merged observation field';
      } 

      let tempBrow = [];

      for (let i=0; i<results.length; i++) {
         let rec = results[i];
         if(rec.ofvs&&rec.ofvs.length>0){
              for( let j=0; j<rec.ofvs.length; j++ ){
                   const matchingRow = add_array.find(item => item.field_id.toString() === rec.ofvs[j].field_id.toString() );
                   if( !matchingRow ) {
                       add_array.push(new ddRow(rec.ofvs[j].field_id.toString(), rec.ofvs[j].name.toLowerCase(), rec.ofvs[j].datatype ) );
                   }
               
                   for( let r=0; r<field_array_copy.length; r++ ) {
                        if( field_array_copy[r] === rec.ofvs[j].field_id.toString() ){
                            let box_row   = box_array.find( boxRow => boxRow.field_id === rec.ofvs[j].field_id.toString() );
                            box_row.field_name   = rec.ofvs[j].name.toString(); 
                            box_row.ofv_datatype = rec.ofvs[j].datatype; 
                        }
                   }
              }
         }
      }

      buildMenu(add_array);
      
      let firstCol = 'yes';
    
      labelCount = 0;
    
      box_array = box_array.filter(box_array => box_array.field_name !== '');

      /*if( box_array.length === 0 ){
          labels.push({innerText:' '});
      }*/

      dlString += '<span id="dltest"><table id="tablekey">';
      dlString += '<tr id="trkey">';  
      dlString += '<td id="key">field id</td>  <td id="key">'+merged+'</td>  </tr>';
    
      for( let e=0; e<box_array.length; e++ ) {
           labelCount++;
           if( box_array[e].field_name !== '' ) {
               dlString += '<tr id="trkey">';
               dlString += '<td id="tdkey">'+buildRemoveObsFieldURL( box_array[e], box_array ) + '</td>';
               dlString += ('<td id="tdkey">' + box_array[e].field_name.toLowerCase() + '</td></tr>');
               if( p_operator !== 'merge' ){
                   labels.push({innerText:box_array[e].field_name});
               } else {
                   if( firstCol === 'yes' ){
                       firstCol = 'no';
                       labels.push({innerText:'Merged Fields (see upper right)'});
                   } 
               }
           } else {
               dlString += ('<tr id="trkey"><td id="tdkey">' + box_array[e].field_id + '</td>');
               dlString += ('<td id="tdkey">missing from this page</td></tr>');
               if( p_operator !== 'merge' ) {
                   labels.push({innerText:''});
               }
           }
      }

      dlString += '</table></span>';
     
      for (let i=0; i<results.length; i++) {
         let rec = results[i];
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
         
         if( rec.taxon_id ){
             tax_id = rec.taxon_id;
             tax_name = rec.taxon_name || '';
             pref_tax_name = rec.taxon_preferred_common_name || '';
           
             if( rec.taxon_default_photo_url ){
                 tax_photo = '<img class="icon" src="'+rec.taxon_default_photo_url+'" />';
             }
         }

         if( tax_id !== '' ) {
             winurlparams.delete('taxon_id');
             taxon = furl(github_root+'observation_fields.html?'+winurlparams+'&taxon_id='+tax_id,'<span style=\"font-size:larger\">'+pref_tax_name.toLowerCase()+'</span><span style=\"font-style:italic\"><br>('+tax_name+')</span>');   
             if( p_taxon_id ) { winurlparams.append('taxon_id', p_taxon_id); }
         }
       
         values = [
                  {innerText:i+1},
                  {innerHTML:tax_photo},
                  {innerHTML:taxon},
                  {innerHTML:furl(root_observations+rec.id,'<img class="mini_photo2" src="'+(rec.photos_url||'')+'" />')},
              ];

         let user_icon = rec.user_icon || '';
         
         if( user_icon === '' ){
            user_icon += '<div class="npcicon"></div>';
         } else {
            user_icon = '<img class="icon" src="'+user_icon+'" />';
         }

         let emojiTitle = 'Merged Observation Fields:&#10;';

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
                          if( rec.ofvs[j].taxon_id ){
                              if( matchTaxonId === '' ){
                                  matchTaxonId = rec.ofvs[j].taxon_id;
                              }
                              if( rec.ofvs[j].taxon_id !== matchTaxonId ){
                                  mismatch = 'yes';
                              }
                          }
                      } 

                      if( p_operator === 'merge' && rec.ofvs[j].field_id.toString() === box_array[r].field_id.toString() ){
                          
                          field1 = rec.ofvs[j].value.toLowerCase();
                                    
                          if( rec.ofvs[j].taxon_id ){ 
                              let name  = rec.ofvs[j].taxon_name || '';
                              let cname = rec.ofvs[j].taxon_preferred_common_name || '';
                              if( p_ofield_iconic === '' || p_ofield_iconic === rec.ofvs[j].taxon_iconic_taxon_id.toString() ){
                                  field1 = name;
                                  displayCommonName = cname.toLowerCase();
                                  displayTaxonName = name;
                                  displayName = '<span style="font-size:larger">'+cname.toLowerCase()+'</span><span style="font-style:italic"><br>('+name+')</span>';
                                  emojiTitle    += (rec.ofvs[j].field_id + ' ' + name + '&#10;');
                              } else { 
                                  emojiTitle    += (rec.ofvs[j].field_id + ' ' + name.toLowerCase() + '&#10;');
                                  displayName = '';
                              }
                          } else {
                                  if( rec.ofvs[j].value.toLowerCase() !== 'unknown' ){
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
                                
                                  if( rec.ofvs[j].taxon_id ){
                                      let name  = rec.ofvs[j].taxon_name || '';
                                      let cname = rec.ofvs[j].taxon_preferred_common_name || '';
                                      field1 = '<span style="font-size:larger">'+cname.toLowerCase()+'</span><span style="font-style:italic"><br>('+name+')</span>';
                                  }
                                  if( p_field_value === '' ){
                                      winurlparams.delete('field_value');
                                      winurlparams.append('field_value', rec.ofvs[j].value.toLowerCase());
                                      winurlparams.delete('field');
                                      winurlparams.append('field', rec.ofvs[j].field_id);
                                      values.push({innerHTML:furl(github_root+'observation_fields.html?'+winurlparams, field1)});
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
                      displayName = '<span style="font-size:larger">'+displayCommonName.toLowerCase()+'</span><span style="font-style:italic"><br>('+displayTaxonName+') <span class="flowericon" title="'+emojiTitle+'">&#x1F338;</span></span>';
                  } else {
                      displayName = '<span style="font-size:larger">'+displayCommonName.toLowerCase()+'</span><span style="font-style:italic"><br>('+displayTaxonName+')</span>';
                  }
              } else {
                  if( mismatch === 'yes' ){
                      displayName += ' ';
                      displayName += '<span class="flowericon" title="'+emojiTitle+'">&#x1F338;</span></span>';    
                  } 
              }
              values.push({innerHTML:displayName});
         }          

         values.push({innerHTML:user_icon});
         values.push({innerHTML:furl(root_people+rec.user_login,rec.user_login)}); 

         if( showRow(rec) ) {
             display_count++;
             tempBrow.push(values);
         } else {
             filtered_count++;
         }
      };
       

      faddelem('p',document.body,{innerHTML:dlString});

      if( mismatch === 'yes' ) {
          if( p_operator === 'merge' ){       
              flower = '<span class="flowericon">&#x1F338; merged obs field values do not match.</span>';
          }
      }  

      faddelem('p',document.body,{innerHTML:'total obs: ' + fcomnum(total_results)+' cached: '   + results.length + '<br/>' + 
                                            'displayed: ' + display_count +        ' filtered: ' + filtered_count });

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

   }
   else { faddelem('p',document.body,{innerText:'No results returned.'}); }; 
};
