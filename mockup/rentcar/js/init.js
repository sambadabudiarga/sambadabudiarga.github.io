$(function() {
	setTimeout(function() {
	  $.getScript("js/vars.js")
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
	  $.getScript("js/functions.js");
	  $.getScript("js/main.js");
	}, 100)
});