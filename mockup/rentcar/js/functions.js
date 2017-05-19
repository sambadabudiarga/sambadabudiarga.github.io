function setPageHash(theHash, onPageLoad) {
  if (theHash.substring(0, 1) == "#") {
    theHash = theHash.substring(1);
  }

  window.location = window.location.origin + window.location.pathname + '#' + theHash;
}

function getLinkFromHash(hashLink, forceReload = true) {  
  // return if hash already the same
  if (document.location.hash == hashLink && !forceReload) {
    return;
  }

  // strip # from hash
  if (hashLink.substring(0, 1) == "#") {
    hashLink = hashLink.substring(1);
  }

  // // check for jwt
  // if (g_jwt != undefined && g_jwt != "") {
  //   // verify jwt here
  //   $.post('api/user/', 
  //     {
  //       accesstype: 'verifyjwt',
  //       jwt: g_jwt
  //     })
  //    .done(function(data) {
  //     if (data == "") {
  //       g_jwt = "";
  //     } else {
  //       data = strToJson(data);

  //       if (data.error) {
  //         $.alert({
  //           title: 'Error',
  //           type: 'red',
  //           content: 'Error parsing value!\n' + data.text,
  //           backgroundDismiss: true,
  //         });
  //         g_jwt = "";
  //       } else {
  //         if (!data.jwtverified) {
  //           g_jwt = "";
  //         }
  //       }
  //     }
      getPage(hashLink);
  //   });
  // } else {
  //   getPage("login");
  // }
}

function getPage(hashLink) {
  // if (g_jwt == undefined || g_jwt == "" && hashLink.substring(0, 5) != "login") {
  //   tmp_hashLink = "login";

  //   if (hashLink != "home" && hashLink != "login") {
  //     tmp_hashLink = tmp_hashLink + "?redirectedfrom=" + hashLink;
  //   }

  //   hashLink = tmp_hashLink;
  // }

  var paramsOri = hashLink.split('?')[1];
  hashLink = hashLink.split('?')[0];

  if (paramsOri == undefined) {
    paramsOri = "";
  }

  // if hashlink is login but jwt is set, redirect to home
  if (hashLink == "login" && g_jwt != undefined && g_jwt != "") {
    hashLink = "dashboard";
  }

  // reset page parameters
  g_pageparams = {};

  if (paramsOri != "") {
    var params = paramsOri.split('&');

    for (var i = 0; i<params.length; i++) {
      var param = params[i];
      param = param.split('=');
      g_pageparams[param[0]] = param[1];
    }
  }

  // set hash
  document.location.hash = hashLink + (paramsOri == "" ? "" : "?" + paramsOri);

  g_currenthash = hashLink;

  var theLink = "app/" + hashLink + "/";
  var action = "page"

  if (g_pageparams.action != undefined && g_pageparams.action != "") {
    action = g_pageparams.action;
  }

  NProgress.start();

  // get css
  $('#pagecss')[0].href = theLink + action + ".css?" + g_currenthash;
  NProgress.set(0.1);

  if (g_debugmode) {
    debugtimestamp = "&" + (new Date().getTime());
  }

  // get html
  $.get(theLink + action + ".html?" + g_currenthash + debugtimestamp)
  .done(function(data) {
    NProgress.set(0.3);

    // hide content first
    $('body>div').hide();

    switch(hashLink) {

      // PARTNERS ONLY
      case "login":
        if ($('#loginpage') == undefined) {
          $('body').append('<div id="loginpage" hidden></div>');
          $('#loginpage').html(data);
        }
        $('#loginpage').show();
        break;
      case "dashboard":
      case "car":
      case "pricing":
      case "setting":
        $('#pagecontent').html(data);
        $('#partnerarea').show();
        break;

      // PUBLIC
      case "home":
      case "find":
      case "partner":
      case "about":
        $('#publiccontent').html(data);
        $('#publicpage').show();
        break;

      default:
        $('#publiccontent').html(data);
        $('#publicpage').show();
    }

    NProgress.set(0.8);

    // get js
    // being done after getting html
    $.getScript(theLink + action + ".js?" + g_currenthash)
     .done(function() {
        NProgress.done();
     })
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
  })
  .fail(function(jqXhr) {
    if (jqXhr.status == "404") {
      setPageHash("404");
    } else {
      $.alert({
        title: 'Error',
        type: 'red',
        content: jqXhr.responseText,
        backgroundDismiss: true,
      });
    }
  })
  .always(function() {
    // set to done if not finished after 5 sec
    setTimeout(function() {
      NProgress.done();
    }, 5000);
  });
}

function strToJson(plainStr) {
  var jsonedStr = {};

  try {
    jsonedStr = JSON.parse(plainStr);
  } catch(e) {
    jsonedStr.error = true;
    jsonedStr.text = plainStr
  }

  return jsonedStr;
}

function formatNumber(plainNumber) {
  var formattedNumber = (plainNumber.length == 1 ? plainNumber : "");

  // try to unformat it first to get plainnumber
  plainNumber = unformatNumber(plainNumber);

  if (plainNumber != "" && formattedNumber == "") {
    // get decimal separator position
    var decimalPosition = plainNumber.toString().indexOf(g_num_decsep);
    decimalPosition = (decimalPosition == -1 ? plainNumber.toString().length - 1 : decimalPosition - 1);

    // if numeric, then use it, else set to 0
    plainNumber = $.isNumeric(plainNumber) ? parseFloat(plainNumber) : 0;

    // formatting begin
    // TODO regex for replacement need to use variable
    formattedNumber = plainNumber.toString().replace(/./g, function(theText, textPosition, fullText) {
        var retVal = "";

        // if it is the decimal position, then set it
        if (textPosition == decimalPosition) {
          retVal = g_num_decsep;
        }

        // if it is after decimal position
        if (textPosition > decimalPosition) {
          retVal = theText;
        } else {
          // if it is not the same as decimal position and decimal position minus it's position mod 3, then set the decimal separator
          retVal = theText + ((decimalPosition != textPosition) && (decimalPosition - textPosition) % 3 === 0 ? g_num_thssep : "");
        }
   
        return retVal;
    });
  }
  return formattedNumber;
}

function unformatNumber(formattedNumber) {
  var numericValue;

  if ($.isNumeric(formattedNumber)) {
    numericValue = formattedNumber;
  } else {
    // TODO regex for replacement need to use variable
    numericValue = formattedNumber.replace(/./g, function(theText, textPosition, fullText) {
      var retVal = theText;
      if (theText == g_num_thssep) retVal = "";
      return retVal
    });
    numericValue = $.isNumeric(numericValue) ? parseFloat(numericValue) : "";
  }

  return numericValue;
}