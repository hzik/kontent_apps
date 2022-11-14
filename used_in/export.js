var items = [];
var items_wmc = [];
var items_final = [];
var orphaned = false;
var lang = "";
var langids = [];
var project = "";
var prev = "";

$(document).ready(function()
{		
	$("#submit").click(function() {
		items = [];
		items_wmc = [];
		items_final = [];
		lang = $("#lang").val();
		project = $("#project").val();
		prev = $("#prev").val();
		langids = [];
		orphaned = $("#orphaned").is(':checked');
		$("#tables").html("");
		$("#msg").html("");
		loadLanguages();
		$('.overlay').show();
	});
});



function loadLanguages() {
	var url = 'https://'+(prev?'preview-':'')+'deliver.kontent.ai/'+project+'/languages';
	$.ajax({
		url: url,
		dataType: 'text',		
		beforeSend: function(xhr, settings) { 
			if (prev) {
				xhr.setRequestHeader('Authorization','Bearer '+prev);
			}
		},
		success: function (data, textStatus, request) {
			data = JSON.parse(data);
			if (data.languages.length > 0) {
				for (var x = 0; x < data.languages.length; x++) {
					langids.push([data.languages[x].system.codename, data.languages[x].system.id]);
				}
				loadItems(project, lang, '', prev);
			}
			else {
				console.log("no data found");
				$("#msg").html("No data found. Please make sure your project has items in specified language.");
				$('.overlay').hide();
			}
		},
		error:function(jqXHR, textStatus, errorThrown){
			 $("#msg").html("No data found. Please make sure you have correct project id, language and the secured access is turned off (or provide preview token).");
			 $('.overlay').hide();
		} 
	});
}

function loadItems(project,lang,xc,prev) {
	var url = 'https://'+(prev?'preview-':'')+'deliver.kontent.ai/'+project+'/items-feed'+(lang?'?language='+lang:'');
	$.ajax({
		url: url,
		dataType: 'text',		
		beforeSend: function(xhr, settings) { 
			if (xc) {
				xhr.setRequestHeader('X-Continuation',xc);
			}
			if (prev) {
				xhr.setRequestHeader('Authorization','Bearer '+prev);
			}
		},
		success: function (data, textStatus, request) {
			data = JSON.parse(data);
			if (data.items.length > 0) {
				processItems(data.items);
				var xc = request.getResponseHeader('X-Continuation');
				if (xc) {
					loadItems(project,lang,xc,prev);
				}
				else {
					countItems();				
				}
			}
			else {
				console.log("no data found");
				$("#msg").html("No data found. Please make sure your project has items in specified language.");
				$('.overlay').hide();
			}
		},
		error:function(jqXHR, textStatus, errorThrown){
			 $("#msg").html("No data found. Please make sure you have correct project id, language and the secured access is turned off (or provide preview token).");
			 $('.overlay').hide();
		} 
	});	
}

function processItems(data) {
	for (var x = 0; x < data.length; x++) {
		for (const key in data[x].elements) {
			if (data[x].elements[key].type=="modular_content") {
				for (var y = 0; y < data[x].elements[key].value.length; y++) {	
					items_wmc.push([data[x].system.codename, data[x].system.name, data[x].system.id, data[x].elements[key].value[y], data[x].system.language]);
				}
			}
			if (data[x].elements[key].type=="rich_text") {
				for (var y = 0; y < data[x].elements[key].modular_content.length; y++) {	
					items_wmc.push([data[x].system.codename, data[x].system.name, data[x].system.id, data[x].elements[key].modular_content[y], data[x].system.language]);
				}
			}
		}
		items.push([data[x].system.codename, data[x].system.name, data[x].system.id, data[x].system.language]);
	}
}

function countItems() {
	if (orphaned) {
		for (var x = 0; x < items.length; x++) {
			var isUsed = false;
			for (var y = 0; y < items_wmc.length; y++) {
				if (items[x][0]==items_wmc[y][3]) {
					isUsed = true;
				}
			}
			if (!isUsed) {
				items_final.push([returnLink(items[x][1], items[x][2]), items[x][0], "not used anywhere"]);
			}
		}
	}
	else {
		for (var x = 0; x < items.length; x++) {
			var isUsed = false;
			var usedIn = [];
			for (var y = 0; y < items_wmc.length; y++) {
				if (items[x][0]==items_wmc[y][3]) {
					isUsed = true;
					usedIn.push(returnLink(items_wmc[y][1], items_wmc[y][2], items_wmc[y][4]));
				}
			}			
			if (!isUsed) {
				items_final.push([returnLink(items[x][1], items[x][2], items[x][3]), items[x][0], "not used anywhere"]);
			}
			else {
				items_final.push([returnLink(items[x][1], items[x][2], items[x][3]), items[x][0], usedIn.join(", ")]);
			}
		}
	}
	buildData(0);
}

function returnLink(name, id, lang) {
	var langid = "00000000-0000-0000-0000-000000000000";
	for (var x = 0; x < langids.length; x++) {
		if (langids[x][0]==lang) {
			langid = langids[x][1];
		}
	}
	return "<a href='https://app.kontent.ai/"+project+"/content-inventory/"+langid+"/content/"+id+"' target='_blank'>"+name+"</a>";
}

function buildData(index) {	
	var table = '<table class="display compact" id="table">';
	var xml = '<items>\n';
	table += '<thead>';
	table += '<tr>';
	table += '<th>Item name</th>';
	table += '<th>Item codename</th>';
	table += '<th>Used in item</th>';
	table += '</tr>';
	table += '</thead>';
	table += '<tbody>';
	for(var y = index; y < items_final.length; y++) {	
		table += '<tr>';
		xml += '\t<item>\n';
		
		table += '<td>';	
		xml += '\t\t<item>\n';	
		table += items_final[y][0];	
		xml += items_final[y][0];				
		table += '</td>';			
		xml += '\t\t</item>\n';	
		
		table += '<td>';	
		xml += '\t\t<item_codename>\n';	
		table += items_final[y][1];	
		xml += items_final[y][1];				
		table += '</td>';			
		xml += '\t\t</item_codename>\n';	
		
		table += '<td>';	
		xml += '\t\t<used_in_item>\n';	
		table += items_final[y][2];	
		xml += items_final[y][2];				
		table += '</td>';			
		xml += '\t\t</used_in_item>\n';	
					
		table += '</tr>';
		xml += '\t</item>\n';
	}
	table += '</tbody>';
	table += '</table>';
	xml += '</items>';
	$("#tables").append(table);	
	addExport(xml,index);
	$('.overlay').hide();
}

function addExport(xml,index) {
	$('#table').DataTable( {
		dom: 'Bfrtip',
		buttons: [
			{
				extend: 'copyHtml5',
				title: 'Data export',
				text: '<i class="fa fa-files-o"></i>',
				titleAttr: 'Copy'
			},
			{
				extend: 'excelHtml5',
				title: 'Data export',
				text: '<i class="fa fa-file-excel-o"></i>',
				titleAttr: 'Excel'
			},
			{
				extend: 'pdfHtml5',
				title: 'Data export',
				text: '<i class="fa fa-file-pdf-o"></i>',
				titleAttr: 'PDF'
			},
			{
                text: '<i class="fa fa-file-code-o"></i>',
				titleAttr: 'XML',
                action: function ( e, dt, node, config ) {
                    var w = window.open(null, null, config='height=600,width=800, addressbar=no');
					w.document.open("text/xml");
					w.document.write('<pre><code>' + escapeHtml(xml) + '</code></pre>');
					w.document.close();
                }
            },
			{
				extend: 'print',
				title: 'Data export',
				text: '<i class="fa fa-print"></i>',
				titleAttr: 'Print'
			}
		]
	} );
}

var entityMap = {
  '\n': '<br />',
  '\t': '&nbsp;',
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

function escapeHtml(string) {
  return String(string).replace(/[&<>"'`=\/]/g, function (s) {
    return entityMap[s];
  });
}