var savemode = "savenew";

$(function() {
	//load form

  // get html
  $.get("app/car/form.html?" + g_currenthash)
  .done(function(data) {
  	$('#pageform').html(data);

    // get js
    // being done after getting html
    $.getScript("app/car/form.js?" + g_currenthash)
     .fail(function() {
		    if(arguments[0].readyState==0){
		      //script failed to load
					$.alert({
						title: 'Error',
						type: 'red',
						content: 'Failed to load script',
						backgroundDismiss: true,
					});
		    }else{
		      //script loaded but failed to parse
					$.alert({
						title: 'Error',
						type: 'red',
						content: 'Failed to parse script<br />' + arguments[2].toString(),
						backgroundDismiss: true,
					});
		    }
     });
  });

})