var glimpse = glimpse || {};

glimpse.FullscreenView = (function() {

  var footerNavTimeout;
  var $footer;
  var isTouch =  ('ontouchstart' in document.documentElement);
  var ignoreNavVisibility = false;

  var FOOTER_NAV_INITIAL_SPLASH_DURATION = 3000;

  function init() {
    $footer = $('.footer');
  }

  function start() {
    $('body').addClass('fullscreen-magazine-active');
    showFooterNavSplash();
    
    if (isTouch || window.navigator.msMaxTouchPoints) {
      $(glimpse).on(glimpse.PageController.EventTypes.CLICK_BACKGROUND, onBGClick);
      $footer.children().on('click', onBGClick);
    } else {
      $('#magazine-component').on('mousemove', $.throttle(150, updateNavVisibility));
    }
    $(document).on('keydown', onKeyPress);
  }

  function stop() {
    $('body').removeClass('fullscreen-magazine-active');
    $(glimpse).off(glimpse.PageController.EventTypes.CLICK_BACKGROUND, onBGClick);
    $('#magazine-component').off('mousemove', $.throttle(150, updateNavVisibility));
    $footer.off('click', onBGClick);
    $footer.removeClass('visible');
    $(document).off('keydown', onKeyPress);
  }

  function showFooterNavSplash() {
    ignoreNavVisibility = true;
    $footer.addClass('visible');
    clearTimeout(footerNavTimeout);
    footerNavTimeout = setTimeout(function() {
      $footer.removeClass('visible');
      ignoreNavVisibility = false;
    }, FOOTER_NAV_INITIAL_SPLASH_DURATION);
  }

  function onBGClick(e) {
    if (ignoreNavVisibility) return;
    $footer.toggleClass('visible');
  }

  function updateNavVisibility(e) {
    if (ignoreNavVisibility) return;

    var $target = $(e.target);
    if (!$target.parents('#catalogue').length || $target.parents('.shadows').length || $target.hasClass('shadows')) {

      $footer.addClass('visible');
    }
    else {
      $footer.removeClass('visible');
    }
  }

  function requestResize() {
    $(glimpse).trigger(glimpse.PageController.EventTypes.RESIZE_CATALOGUE);
  }

  function onKeyPress(e) {
    if (e.keyCode == 27) {
      $(glimpse).trigger(glimpse.PageController.EventTypes.REQUEST_VIEW_CHANGE, {
        view: glimpse.PageController.ViewTypes.SPREAD
      });
    }
  }

  return {
    init: init,
    start: start,
    stop: stop
  };

}());