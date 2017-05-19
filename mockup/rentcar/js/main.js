$(function() {
  // parse hash and get page on page load
  if ($('title').text() == "") {
    $('title').text(g_pagetitle);
  }

  g_jwt = Cookies.get("jwt");
  g_jwt = (g_jwt == undefined ? "" : g_jwt);

  // if (g_jwt == "") {
  //   getLinkFromHash("login");
  // } else {
    g_onfirstload = false;
    if (window.location.hash == "") {
      getLinkFromHash(g_initPagename);
    } else {
      getLinkFromHash(window.location.hash);
    }
    // g_onfirstload = false;
  // }
});

$(window).on("hashchange", function(e) {
  // not need to detect hashchanged, already done on page load
  if (g_onfirstload) {
    g_onfirstload = false;
    return;
  }

  // get hash
  var theLink = window.location.href.split("/");
  theLink = theLink[theLink.length - 1];

  getLinkFromHash(theLink);
});

// destroy jwt on logout
$('a.logout').click(function(e) {
  g_jwt = "";
  Cookies.remove("jwt");
  setPageHash("login");
  return false;
});

$('a.changepassword').click(function(e) {
  g_modalpage = $.dialog({
    title: 'Change Password',
    content: 'url:app/user/changepassword.html',
    animation: 'zoom',
    columnClass: 'medium',
    backgroundDismiss: true,
    onContentReady: function() {
      $.getScript("app/user/changepassword.js");
    }
  });
})

$(document).on('paste', 'input.numeric', function(e) {
  var $this = $(this);
  var prevValue = $this.val();
  setTimeout(function() {
    if (!($.isNumeric($this.val()))) {
      $this.val(unformatNumber($this.val()));
      if (!($.isNumeric($this.val()))) {
        $this.val(prevValue);
      }
    }
  }, 50);
});

$(document).on('keypress', 'input.numeric', function(e) {
  // allow ctrl
  if (e.ctrlKey) {
    return true;
  }

  switch (e.key.toUpperCase()) {
    case "1":
    case "2":
    case "3":
    case "4":
    case "5":
    case "6":
    case "7":
    case "8":
    case "9":
    case "0":
    case ".":
    case "TAB":
    case "DELETE":
    case "BACKSPACE":
    case "ARROWRIGHT":
    case "ARROWLEFT":
    case "ARROWUP":
    case "ARROWDOWN":
    case "HOME":
    case "END":
      return true;
    default:
      if (!$.isNumeric(e.key)) return false;
  }

  return false;
})

$(document).on('focus', 'input.numeric', function(e) {
  $(this).val(unformatNumber($(this).val()));
});

$(document).on('blur', 'input.numeric', function(e) {
  $(this).val(formatNumber($(this).val()));
});