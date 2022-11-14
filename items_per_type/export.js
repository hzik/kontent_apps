var items = [];
var types = [];

$(document).ready(function()
{		
	$("#submit").click(function() {
		items = [];
		types = [];
		$("#tables").html("");
		$("#msg").html("");
		loadTypes($("#project").val(), $("#lang").val(), '', $("#prev").val());
		$('.overlay').show();
	});
});

function loadTypes(project,lang,xc,prev) {
	var url = 'https://'+(prev?'preview-':'')+'deliver.kontent.ai/'+project+'/types';
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
			if (data.types.length > 0) {
				processTypes(data.types);
				var xc = request.getResponseHeader('X-Continuation');
				if (xc) {
					loadTypes(project,lang,xc,prev);
				}
				else {
					loadItemCountForType(project,lang,prev,0);					
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

function loadItemCountForType(project,lang,prev,i) {
	var url = 'https://'+(prev?'preview-':'')+'deliver.kontent.ai/'+project+'/items?system.type='+types[i].system.codename+'&includeTotalCount=true&limit=1'+(lang?'&language='+lang:'');
	
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
			items.push([types[i].system.name,types[i].system.codename,data.pagination.total_count]);
			if (i < types.length-1) {
				loadItemCountForType(project,lang,prev,++i);
			}
			else {
				buildData(0);					
			}
		},
		error:function(jqXHR, textStatus, errorThrown){
			 $("#msg").html("No data found. Please make sure you have correct project id, language and the secured access is turned off.");
			 $('.overlay').hide();
		} 
	});	
	
}

function processTypes(data) {
	for (var x = 0; x < data.length; x++) {
		types.push(data[x]);
	}
}

function buildData(index) {	
	var table = '<table class="display compact" id="table">';
	var xml = '<items>\n';
	table += '<thead>';
	table += '<tr>';
	table += '<th>Content type name</th>';
	table += '<th>Content type codename</th>';
	table += '<th>Number of items</th>';
	table += '</tr>';
	table += '</thead>';
	table += '<tbody>';
	for(var y = index; y < items.length; y++) {	
		table += '<tr>';
		xml += '\t<item>\n';
		
		table += '<td>';	
		xml += '\t\t<type_name>\n';	
		table += items[y][0];	
		xml += items[y][0];				
		table += '</td>';			
		xml += '\t\t</type_name>\n';	
		
		table += '<td>';	
		xml += '\t\t<type_codename>\n';	
		table += items[y][1];	
		xml += items[y][1];				
		table += '</td>';			
		xml += '\t\t</type_codename>\n';	
		
		table += '<td>';	
		xml += '\t\t<item_number>\n';	
		table += items[y][2];	
		xml += items[y][2];				
		table += '</td>';			
		xml += '\t\t</item_number>\n';	
			
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