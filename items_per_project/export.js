var items = [];
var projects = [];

$(document).ready(function()
{		
	$("#submit").click(function() {
		items = [];
		types = [];
		$("#tables").html("");
		$("#msg").html("");
		loadProjects($("#subscription").val(), $("#sapi").val(), '');
		$('.overlay').show();
	});
});

function loadProjects(subscription,sapi,xc) {
	var url = 'https://manage.kontent.ai/v2/subscriptions/'+subscription+'/projects';
	$.ajax({
		url: url,
		dataType: 'text',		
		beforeSend: function(xhr, settings) { 
			if (xc) {
				xhr.setRequestHeader('X-Continuation',xc);
			}
			xhr.setRequestHeader('Authorization','Bearer '+sapi);
		},
		success: function (data, textStatus, request) {
			data = JSON.parse(data);
			if (data.projects.length > 0) {
				processProjects(data.projects);
				var xc = request.getResponseHeader('X-Continuation');
				if (xc) {
					loadProjects(subscription,sapi,xc);
				}
				else {
					loadItemCountForProject(subscription,sapi,0);					
				}
			}
			else {
				console.log("no data found");
				$("#msg").html("No data found. Please make sure your subscriptions has a project.");
				$('.overlay').hide();
			}
		},
		error:function(jqXHR, textStatus, errorThrown){
			 $("#msg").html("No data found. Please make sure you have correct subscription id, subscription API key and preview API key.");
			 $('.overlay').hide();
		} 
	});	
}

function loadItemCountForProject(subscription,lang,i) {
	var url = 'https://deliver.kontent.ai/'+projects[i][1]+'/items?includeTotalCount=true&limit=1';
	
	$.ajax({
		url: url,
		dataType: 'text',
		success: function (data, textStatus, request) {
			data = JSON.parse(data);
			items.push([projects[i][0],projects[i][2],data.pagination.total_count]);
			if (i < projects.length-1) {
				loadItemCountForProject(subscription,lang,++i);
			}
			else {
				buildData(0);					
			}
		},
		error:function(jqXHR, textStatus, errorThrown){
			 $("#msg").html("No data found. Please make sure you have correct subscription id, subscription API key and preview API key.");
			 $('.overlay').hide();
		} 
	});	
	
}

function processProjects(data) {
	for (var x = 0; x < data.length; x++) {
		for (var y = 0; y < data[x].environments.length; y++) {
			if (data[x].is_active) {
				projects.push([data[x].name,data[x].environments[y].id,data[x].environments[y].name]);
			}
		}
	}
}

function buildData(index) {	
	var table = '<table class="display compact" id="table">';
	var xml = '<items>\n';
	table += '<thead>';
	table += '<tr>';
	table += '<th>Project name</th>';
	table += '<th>Environment</th>';
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