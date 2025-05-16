<style>
  
.navbar {
  overflow: hidden;
  background-color: var(--color-brand);
  border-radius: 5px 5px 5px 5px;
  font-family: Arial, Helvetica, sans-serif;
}

.navbar a {
  float: left;
  font-size: 16px;
  color: white;
  text-align: center;
  /*padding: 15px 14px 12px 14px;*/
  padding: 12px 14px;
  text-decoration: none;
}

.dropdown {
  float: left;
  overflow: hidden;
}

.dropdown {
  cursor: pointer;
  font-size: 16px;  
  border: none;
  outline: none;
  color: white;
  background-color: inherit;
  font-family: inherit;
  margin: 0;
}

.dropbtn {
  cursor: pointer;
  font-size: 16px;  
  border: none;
  outline: none;
  color: white;
  padding: 12px 14px;
  /*padding: 17px 14px 12px 14px;*/
  background-color: inherit;
  font-family: inherit;
  margin: 0;
}

.navbar a:hover, .dropdown:hover .dropbtn, .dropbtn:focus {
  background-color: black;
}

.dropdown-content {
  display: none;
  position: absolute;
  font-size: 16px;
  background-color: #f9f9f9;
  min-width: 160px;
  box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
  z-index: 1;
}

.dropdown-content a {
  float: none;
  color: black;
  padding: 10px 14px 10px 14px;
  /*padding: 10px 14px;*/
  text-decoration: none;
  display: block;
  text-align: left;
}

.dropdown-content a:hover {
  background-color: #ddd;
}
 
.dropdown-content a:first-child {
  border-radius: 5px 5px 0 0;
}

.dropdown-content a:last-child {
  border-radius: 0 0 5px 5px;
}

.dropdown:hover .dropdown-content {
  display: block;
}

.show {
  display: block;
}

</style>

function buildDD( name, content ) {
  let dd = '<div class="dropdown">' +
                 '<button class="dropbtn">' + name +
                    '<i class="fa fa-caret-down"></i>' +
                 '</button>' +
                    '<div class="dropdown-content">' +
                          content +
                    '</div>' +
           '</div>';

  return( dd );
}
