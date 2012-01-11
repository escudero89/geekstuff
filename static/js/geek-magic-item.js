//// GLOBAL VARIABLES
var current_id = 1, // for the row id

	per_minor = 0.3, // probability to take one or more lesser level object in percent	
	
	per_item_equiv = 0.54, // experimental value, table MIC 6-4 item level equivalencies
	
	max_current_level = 25, // max level of object that figures in the list
	
	gold_per_level = [ // max value of market price range	
	0, 50,150,400,800,1300,1800,2300,3000,4000,5000,6500,
	8000,10000,13000,18000,25000,35000,48000,64000,80000,100000,
	120000,140000,160000,180000,200000,220000,240000,260000,280000,300000],
	
	current_gold_total = [], // amount of gold spent
	
	current_item_list = [], // list of objects in the table
	
	$json_items = {}; // here i'll save the json with the list of objects

//// ADD, EDIT, AND REMOVE ITEMS FUNCTIONS
/// Call this functions any time that I made a change in the table
function mi_call(order) {
	if (order) {
		mi_sort_list(); // reorder
	}
	
	// refresh only if autosave is enabled
	if ($("#autosave").attr("checked") === "checked") {
		mi_pass_info(); 
	}	
}

/// Pass a row id, then change that item in the row, using the same object level
function change_item(row_id) {
	row_id = "#" + row_id + " > td:"; 
	
	var get_level_object = $(row_id + "eq(0)").html(),
		new_object = mi_give_item(get_level_object);
	
	$(row_id + "eq(1)").html(new_object[1]);
	$(row_id + "eq(2)").html(new_object[2]);	
}

/// Delete the given id of the row from the main table
function mi_delete_item(id_row) {
	
	$("#" + id_row).remove();
	
	console.log(current_item_list.length);
	
	current_item_list = jQuery.grep(current_item_list, function(value) {				
		return value["id"] != id_row;
	});
	console.log(current_item_list.length);
	console.log("deleted");
}

/// Add some item to the table
function mi_add_item(id_row, gold, lvl, name, page) {
	
	var action_change = "change_item('" + id_row + "')",
		boton_change = '<button type="button" onclick="' + 
			action_change + '">' + lang["change"] + '</button>',
			
		action_delete = "mi_delete_item('" + id_row + "')",
		boton_delete = '<button type="button" onclick="' +
			action_delete + '">' + lang["delete"] + '</button';
		
		current_id += 1;						
				
		
		$("#tabla tr:last").after(
			"<tr id='" + id_row + "' gold='" + gold + "'>" + 
			"<td>" + lvl + "</td>" +
			"<td>" + name + "</td>" +
			"<td>" + page + "</td>" +
			"<td>" + boton_change + boton_delete + "</td>" + 
			"</tr>"			
		);			
}

//// BACKGROUND FUNCTIONS
/// Fill the table using the current list
function mi_fill_table() {		
	$.each(current_item_list, function (key, item) {							
		mi_add_item(item["id"], item["gold"], item["lvl"], item["name"], item["page"]);			
	});	
}

/// Put all the treasure in the current list
function mi_fill_current_item_list(treasure) {		
	
	var single_item,
		all_items = [],
		item = {
			"id" : 'item-id' + current_id,
			"gold" : 0,
			"lvl" : "",
			"name" : "",			
			"page" : ""
		};
	
	$.each(treasure["item-list"], function (key, val) {					
		single_item = mi_give_item(val);
		
		item["id"] = 'item-id' + current_id;
		item["gold"] = treasure["gold"];
		item["lvl"] = val;
		item["name"] = single_item[1]; 
		item["page"] = single_item[2];
		
		current_item_list.push(item);	
		mi_add_item(item["id"], item["gold"], item["lvl"], item["name"], item["page"]);																
	});				
}

//// UTILITIES FUNCTIONS
/// Choose a item from the list, based in a object level and a porcentual dice
function mi_give_item(level) {
	
	var dpercent = parseInt( Math.random() * 100 ),
		retorno;						
	
	if (level >= 0 && level <= max_current_level) {		
		$.each($json_items[level], function (key, val) {			
			if (val[0] - dpercent >= 0) {				
				retorno = val;
				return false;				
			}			
		});				
	}
	return retorno;	
}

/// Sort the current_item_list
function mi_sort_list() {
	var sorted_list = current_item_list;
	
	// remove everything from the table
	mi_big_clear();
	
	$comp = $("#select option:selected").val();
	
	$desc = $("#desc").attr("checked") != "checked" ? 1 : -1;
	
	if (sorted_list.length >= 2) {
		sorted_list.sort(function(a, b) {			
			var compA = a[$comp];
			var compB = b[$comp];			
			return (compA < compB) ? -1 * $desc : (compA > compB) ? 1 * $desc : 0;			
		});
	}
	current_item_list = sorted_list;
	mi_fill_table();
}

/// Stick together all the gold spent in table
function stick_gold() {
	var max_info = $("#tabla tr:gt(0)").length, i=1, $fila, total = 0;
	
	do {
		$fila = $('#tabla tr:eq(' + i + ') ');
		
		total += $fila.attr("gold") * 1.0;
		
		i += 1;
	} while ( i <= max_info );
	
	$("#total_gold").val(total + " po");
}

/// Change the default format and verify
function mi_give_format(format) {	
	
	format = $("#format").val();
	format = format || "{name} [item lvl: {level}, reference: {page}]";	
	
	// If it's empty, put the default value
	$("#format").val(format);	
	
	return format;			
}

/// Clear everything (textarea, tables, variables)
function mi_big_clear() {
	$('#tabla tr:gt(0)').remove('');
	$('#textarea').val('')
	current_item_list = [];
}

//// MAIN LOAD FUNCTIONS
/// Put all the info of the tabla right in the textarea
function mi_pass_info(format) {	
	var max_info = $("#tabla tr:gt(0)").length, i=1,
		newformat,
		$textarea = $("#textarea"),
		
		$tabla,	$f_lvl, $f_name, $f_page;	
 
	$textarea.val('');
	
	format = mi_give_format(format);	
	
	do {			
		newformat = format;
		
		$tabla = '#tabla tr:eq(' + i + ') ';
		
		$f_lvl = $($tabla + "td:eq(0)").text();
		$f_name = $($tabla + "td:eq(1)").text();
		$f_page = $($tabla + "td:eq(2)").text();
		
		newformat = newformat.replace("{level}", $f_lvl);
		newformat = newformat.replace("{name}", $f_name);
		newformat = newformat.replace("{page}", $f_page);
		
		$textarea.val(			
			$textarea.val() +			
			 newformat + "\n");
			
		i += 1;			
	} while ( i <= max_info );
	
	// refresh price
	stick_gold();		
}

/// Give amount of gold, add max item to current and substract gold
function mi_get_level_item(oro) {
	var i = max_current_level + 1, random_price;		
	
	do {					
		random_price = parseInt(Math.random() * (gold_per_level[i] - gold_per_level[i - 1]));		
		random_price += gold_per_level[i - 1];														
		
		i -= 1;
		
	} while ( i > 0 && oro - random_price < 0 )
	
	current_treasure["gold"] = random_price;
	current_treasure["item-list"].push(i);				
}

/// Main function, give gold, return a list of magic items
function mi_get_treasure(oro) {
	
	oro = $("#input").val();
	
	current_treasure = { // here i'll save all the data about the current operation
		"item-list" : [],
		"gold" : 0
	};	
	
	current_treasure["gold"] = oro;
	
	if (Math.random() < per_minor) {
		mi_get_level_item(oro * per_item_equiv);
		mi_get_level_item(oro * per_item_equiv);		
		
	} else {
		mi_get_level_item(oro);
	}		
	
	mi_fill_current_item_list(current_treasure);	
	mi_call(true);
}
