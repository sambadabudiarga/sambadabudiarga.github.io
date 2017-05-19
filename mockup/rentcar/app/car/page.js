var theData = [
	{
		policeno: "DK 111 II",
		manufacturer: "HONDA",
		description: "Honda Civic Series",
		year: 2005
	},
	{
		policeno: "DK 222 RR",
		manufacturer: "SUZUKI",
		description: "Suzuki",
		year: 2014
	},
	{
		policeno: "DK 333 BB",
		manufacturer: "Chevrolet",
		description: "City Car Series",
		year: 2017
	},
];

$(function() {
	$('title').text(g_pagetitle + ' - Cars');

	theTable = $("#datatable").DataTable({
		// serverSide: true,
		// ajax: theData,
		responsive: true,
		processing: true,
		searchDelay: 1500,
		// columns: [
		// 	{data: "policeno", name: "policeno"},
		// 	{data: "manufacturer", name: "manufacturer"},
		// 	{data: "description", name: "description"},
		// 	{data: "year", name: "year"},
		// 	{
		// 		"render": function(data, type, row) {
		// 			var editbutton = '<a href="javascript:;;" class="edit"><i class="fa fa-pencil" title="Edit"></i></a>';
		// 			var deletebutton = '<a href="javascript:;;" class="delete"><i class="fa fa-trash" title="Delete"></i></a>';
		// 			return editbutton + ' ' + deletebutton;
		// 		}, 
		// 		orderable: false,
		// 		className: "action",
		// 	},
		// ],
	});

	var editbutton = '<a href="javascript:;;" class="edit"><i class="fa fa-pencil" title="Edit"></i></a>';
	var deletebutton = '<a href="javascript:;;" class="delete"><i class="fa fa-trash" title="Delete"></i></a>';

	$("#datatable").find('tbody>tr').remove();

	for (i=0; i<theData.length; i++) {
		$("#datatable").append(
			'<tr>\
				<td>' + theData[i].policeno + '</td>\
				<td>' + theData[i].manufacturer + '</td>\
				<td>' + theData[i].description + '</td>\
				<td>' + theData[i].year + '</td>\
				<td>' + editbutton + ' ' + deletebutton + '</td>\
			</tr>');
	}
});

$("#btnNew").click(function() {
	setPageHash("car?action=add");
});