var attributes_panel = document.getElementById('attributes_panel');
var is_attributes_panel_visible = false;
var region_attributes = {};
var img_metadata = {};
var image_id = "";

//
// Data structure for annotations
//
function ImageMetadata(fileref, filename, size) {
  this.filename = filename;
  this.size     = size;
  this.fileref  = fileref;          // image url or local file ref.
  this.regions  = [];
  this.file_attributes = {};        // image attributes
  this.base64_img_data = '';        // image data stored as base 64
}

function ImageRegion() {
  this.is_user_selected  = false;
  this.shape_attributes  = {}; // region shape attributes
  this.region_attributes = {}; // region attributes
}


//
// Handlers for attributes input panel (spreadsheet like user input panel)
//
function attr_input_focus(i) {
  if ( is_reg_attr_panel_visible ) {
    select_only_region(i);
    redraw_reg_canvas();
  }
  is_user_updating_attribute_value=true;
}

function attr_input_blur(i) {
  if ( is_reg_attr_panel_visible ) {
    set_region_select_state(i, false);
    redraw_reg_canvas();
  }
  is_user_updating_attribute_value=false;
}

// header is a Set()
// data is an array of Map() objects
function init_spreadsheet_input(type, col_headers, data, row_names) {

  if ( typeof row_names === 'undefined' ) {
    var row_names = [];
    for ( var i = 0; i < data.length; ++i ) {
      row_names[i] = i+1;
    }
  }
  var attrname = '';
  switch(type) {
  case 'region_attributes':
    attrname = 'Region Attributes';
    break;

  case 'file_attributes':
    attrname = 'File Attributes';
    break;
  }

  var attrtable = document.createElement('table');
  attrtable.setAttribute('id', 'attributes_panel_table');
  var firstrow = attrtable.insertRow(0);

  // top-left cell
  var topleft_cell = firstrow.insertCell(0);
  topleft_cell.innerHTML = '';
  topleft_cell.style.border = 'none';

  for (var col_header in col_headers) {
    firstrow.insertCell(-1).innerHTML = '<b>' + col_header + '</b>';
  }
  // allow adding new attributes
  firstrow.insertCell(-1).innerHTML = '<input type="text"' +
    ' onchange="add_new_attribute(\'' + type[0] + '\', this.value)"' +
    ' value = "[ Add New ]"' +
    ' onblur="is_user_adding_attribute_name=false; this.value = \'\';"' +
    ' onfocus="is_user_adding_attribute_name=true; this.value = \'\';" />';

  // if multiple regions are selected, show the selected regions first
  var sel_reg_list       = [];
  var remaining_reg_list = [];
  var all_reg_list       = [];
  var region_traversal_order = [];
  if (type === 'region_attributes') {
    // count number of selected regions
    for ( var i = 0; i < data.length; ++i ) {
      all_reg_list.push(i);
      if ( data[i].is_user_selected ) {
        sel_reg_list.push(i);
      } else {
        remaining_reg_list.push(i);
      }
    }
    if ( sel_reg_list.length > 1 ) {
      region_traversal_order = sel_reg_list.concat(remaining_reg_list);
    } else {
      region_traversal_order = all_reg_list;
    }
  }

  var sel_rows = [];
  for ( var i=0; i < data.length; ++i ) {
    var row_i = i;

    // if multiple regions are selected, show the selected regions first
    var di;
    if ( type === 'region_attributes' ) {
      if ( sel_reg_list.length ) {
        row_i = region_traversal_order[row_i];
      }
      di = data[row_i].region_attributes;
    } else {
      di = data[row_i];
    }

    var row = attrtable.insertRow(-1);
    var region_id_cell              = row.insertCell(0);
    region_id_cell.innerHTML        = '' + row_names[row_i] + '';
    region_id_cell.style.fontWeight = 'bold';
    region_id_cell.style.width      = '2em';

    if (data[row_i].is_user_selected) {
      region_id_cell.style.backgroundColor = '#5599FF';
      row.style.backgroundColor = '#f2f2f2';
      sel_rows.push(row);
    }

    for ( var key in col_headers ) {
      var input_id = type[0] + '#' + key + '#' + row_i;

      if ( di.hasOwnProperty(key) ) {
        var ip_val = di[key];
        // escape all single and double quotes
        ip_val = ip_val.replace(/'/g, '\'');
        ip_val = ip_val.replace(/"/g, '&quot;');

        if ( ip_val.length > 30 ) {
          row.insertCell(-1).innerHTML = '<textarea ' +
            ' rows="' + (Math.floor(ip_val.length/30)-1) + '"' +
            ' cols="30"' +
            ' id="' +   input_id + '"' +
            ' autocomplete="on"' +
            ' onchange="update_attribute_value(\'' + input_id + '\', this.value)"' +
            ' onblur="attr_input_blur(' + row_i + ')"' +
            ' onfocus="attr_input_focus(' + row_i + ');"' +
            ' >' + ip_val + '</textarea>';
        } else {
          row.insertCell(-1).innerHTML = '<input type="text"' +
            ' id="' +   input_id + '"' +
            ' value="' + ip_val + '"' +
            ' autocomplete="on"' +
            ' onchange="update_attribute_value(\'' + input_id + '\', this.value)"' +
            ' onblur="attr_input_blur(' + row_i + ')"' +
            ' onfocus="attr_input_focus(' + row_i + ');" />';
        }
      } else {
        row.insertCell(-1).innerHTML = '<input type="text"' +
          ' id="' + input_id + '"' +
          ' onchange="update_attribute_value(\'' + input_id + '\', this.value)" ' +
          ' onblur="attr_input_blur(' + row_i + ')"' +
          ' onfocus="attr_input_focus(' + row_i + ');" />';
      }
    }
  }

  attributes_panel.replaceChild(attrtable, document.getElementById('attributes_panel_table'));
  attributes_panel.focus();

  // move vertical scrollbar automatically to show the selected region (if any)
  if ( sel_rows.length === 1 ) {
    var panelHeight = attributes_panel.offsetHeight;
    var sel_row_bottom = sel_rows[0].offsetTop + sel_rows[0].clientHeight;
    if (sel_row_bottom > panelHeight) {
      attributes_panel.scrollTop = sel_rows[0].offsetTop;
    } else {
      attributes_panel.scrollTop = 0;
    }
  } else {
    attributes_panel.scrollTop = 0;
  }
}

function update_attributes_panel(type) {
  if (image_loaded &&
      is_attributes_panel_visible) {
    if (is_reg_attr_panel_visible) {
      update_region_attributes_input_panel();
    }

    if ( s_file_attr_panel_visible ) {
      update_file_attributes_input_panel();
    }
    update_vertical_space();
  }
}

function update_region_attributes_input_panel() {
  init_spreadsheet_input('region_attributes',
                         region_attributes,
                         img_metadata[image_id].regions);

}

function update_file_attributes_input_panel() {
  init_spreadsheet_input('file_attributes',
                         file_attributes,
                         [img_metadata[image_id].file_attributes],
                         [current_image_filename]);
}

function toggle_attributes_input_panel() {
  if( is_attributes_panel_visible ) {
    toggle_reg_attr_panel();
  }
}

function toggle_reg_attr_panel() {
  if ( image_loaded ) {
    var panel = document.getElementById('reg_attr_panel_button');
    panel.classList.toggle('active');
    if ( is_attributes_panel_visible ) {
        attributes_panel.style.display   = 'none';
        is_attributes_panel_visible = false;
        // reg_canvas.focus();
        // add horizontal spacer to allow scrollbar
        // var hs = document.getElementById('horizontal_space');
        // hs.style.height = attributes_panel.offsetHeight+'px';
    } else {
      is_attributes_panel_visible = true;
      // update_region_attributes_input_panel();
      // update_region_attributes_input_panel();
      attributes_panel.style.display = 'block';
      attributes_panel.focus();
    }
    // update_vertical_space();
  } else {
    alert('Please load some images first');
  }
}



// this vertical spacer is needed to allow scrollbar to show
// items like Keyboard Shortcut hidden under the attributes panel
function update_vertical_space() {
  var panel = document.getElementById('vertical_space');
  panel.style.height = attributes_panel.offsetHeight+'px';
}

function update_attribute_value(attr_id, value) {
  var attr_id_split = attr_id.split('#');
  var type = attr_id_split[0];
  var attribute_name = attr_id_split[1];
  var region_id = attr_id_split[2];

  switch(type) {
  case 'r': // region attribute
    img_metadata[image_id].regions[region_id].region_attributes[attribute_name] = value;
    update_region_attributes_input_panel();
    break;

  case 'f': // file attribute
    img_metadata[image_id].file_attributes[attribute_name] = value;
    update_file_attributes_input_panel();
    break;
  }
  if (is_reg_attr_panel_visible) {
    set_region_select_state(region_id, false);
  }
  redraw_reg_canvas();
  is_user_updating_attribute_value = false;
  save_current_data_to_browser_cache();
}

function add_new_attribute(type, attribute_name) {
  switch(type) {
  case 'r': // region attribute
    if ( !region_attributes.hasOwnProperty(attribute_name) ) {
      region_attributes[attribute_name] = true;
    }
    update_region_attributes_input_panel();
    break;

  case 'f': // file attribute
    if ( !file_attributes.hasOwnProperty(attribute_name) ) {
      file_attributes[attribute_name] = true;
    }
    update_file_attributes_input_panel();
    break;
  }
  is_user_adding_attribute_name = false;
}

init_spreadsheet_input('region_attributes', region_attributes, img_metadata);
