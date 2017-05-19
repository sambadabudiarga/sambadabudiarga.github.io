var theData = [
	{
		policeno: "DK 111 II",
		pricing: [
			{
				date: "01 Juni 2015 - 30 Mei 2016",
				price: 500000
			},
			{
				date: "01 Juni 2016 - 30 Juni 2016",
				price: 750000
			},
			{
				date: "01 Juli 2016 - 30 Juni 201",
				price: 500000
			},
		]
	},
	{
		policeno: "DK 222 RR",
		pricing: [
			{
				date: "01 Juni 2015 - 30 Mei 2016",
				price: 350000
			},
			{
				date: "01 Juni 2016 - 30 Juni 2016",
				price: 500000
			},
			{
				date: "01 Juli 2016 - 30 Juni 201",
				price: 800000
			},
		]
	},
	{
		policeno: "DK 333 BB",
		pricing: [
			{
				date: "01 Juni 2015 - 30 Mei 2016",
				price: 250000
			},
			{
				date: "01 Juni 2016 - 30 Juni 2016",
				price: 750000
			},
			{
				date: "01 Juli 2016 - 30 Juni 201",
				price: 450000
			},
		]
	},
];

var editbutton = '<a href="javascript:;;" class="edit"><i class="fa fa-pencil" title="Edit"></i></a>';
var deletebutton = '<a href="javascript:;;" class="delete"><i class="fa fa-trash" title="Delete"></i></a>';

$(function() {
	$('title').text(g_pagetitle + ' - Pricing');

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
});

// load data
$('select.car').change(function() {
	$("#datatable").find('tbody>tr').remove();

	var selectedVal = $(this).find('option:selected').text();

	var priceData = $.grep(theData, function(e) {if (e.policeno == selectedVal) return e});

	if (priceData.length > 0) priceData = priceData[0].pricing

	for (i=0; i<priceData.length; i++) {
		$("#datatable").append(
			'<tr>\
				<td>' + priceData[i].date + '</td>\
				<td>' + priceData[i].price + '</td>\
				<td>' + editbutton + ' ' + deletebutton + '</td>\
			</tr>');
	}
});