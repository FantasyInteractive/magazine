var glimpse = glimpse || {};

glimpse.PageController = (function() {

  var maxPages = 1;
  var currentPage = 1;
  var skipNextHashChangeEvent = false;
  var prevCatWidth;
  var prevWinHeight;
  var isTouch = (('ontouchstart' in document.documentElement) || window.navigator.msMaxTouchPoints);

  var $catalogue;
  var $gridView;
  var $viewControls;
  var $catalogueWrapper;

  var ViewTypes = {
    GRID: 'grid',
    SPREAD: 'spread',
    FULLSCREEN: 'fullscreen'
  };

  var EventTypes = {
    REQUEST_HASH_CHANGE: 'PageController::REQUEST_HASH_CHANGE',
    REQUEST_VIEW_CHANGE: 'PageController::REQUEST_VIEW_CHANGE',
    RESIZE_CATALOGUE: 'PageController::RESIZE_CATALOGUE',
    WILL_ENTER_FULLSCREEN: 'PageController::WILL_ENTER_FULLSCREEN',
    CLICK_BACKGROUND: 'PageController::CLICK_BACKGROUND'
  };

  var ViewTypesGA = {
    grid: 'page index',
    spread: 'product index',
    fullscreen: 'full spread'
  };

  function init() {
    $catalogue = $('#catalogue');
    $gridView = $('.grid-view-wrapper');
    $viewControls = $('.view-control-tabs');
    $catalogueWrapper = $('.catalogue-wrapper');

    if (isTouch) {
      $('body').addClass('is-touch');
    } else {
      $('body').addClass('not-touch');
    }

    maxPages = $catalogue.children().length;

    setStartingPage();
    setupProductData();
    glimpse.SpreadView.init(currentPage, maxPages);
    glimpse.GridView.init();
    glimpse.FullscreenView.init();
    setupEvents();
    setInterval(checkForResizeNeed, 100);
    setView(ViewTypes.FULLSCREEN);
  }

  function setStartingPage() {
    currentPage = Math.min(maxPages, getPageFromHash());
  }

  function getPageFromHash() {
    var pageIndex = location.hash.indexOf('page-');
    var page = Math.max(1, parseInt(location.hash.slice(pageIndex + 5)));
    return page || 1;
  }

  function currentView() {
    return $('.active', $viewControls).data('type');
  }

  function setupProductData() {
    var productData = [];
    var product;
    $('.product-list li').each(function() {
      product = $.extend({}, $(this).data());
      product.ddkey = $(this).attr('ddkey');
      productData.push(product);
    });
    glimpse.ProductModel.populate(productData);
  }

  function setupEvents() {
    $(glimpse).on(EventTypes.REQUEST_HASH_CHANGE, $.proxy(updateHash, this));

    // Listen for view toggling.
    $('div', $viewControls).on('click', function(event) {
      var $tab = $(event.currentTarget);
      setView($tab.data('type'));
    });

    $(glimpse).on(glimpse.PageController.EventTypes.REQUEST_VIEW_CHANGE, onRequestViewChange);
    $(window).on('hashchange', $.proxy(onHashChange, this));
    $('.wrapper').on('click', onBGClick);
    $('.glimpse_sidebar_button').on('click', onSideNavToggle);
  }

  function onSideNavToggle(e) {
    if ($('.tf_browse_page').hasClass('open')) {
      if (currentView() == ViewTypes.SPREAD) {
        glimpse.SpreadView.hideProductList();
      }
    } else {
      if (currentView() == ViewTypes.SPREAD) {
        glimpse.SpreadView.showProductList();
      }
    }
  }

  function onBGClick(e) {
    var $t = $(e.target);
    if ($t.hasClass('wrapper') ||
      $t.hasClass('left-shadow') ||
      $t.hasClass('right-shadow') ||
      $t.hasClass('catalogue-wrapper') ||
      $t.attr('id') == 'content') {
      $(glimpse).trigger(glimpse.PageController.EventTypes.CLICK_BACKGROUND);
    }
  }

  function onRequestViewChange(e, data) {
    if (data && data.view) {
      setView(data.view);
    }
  }

  function setView(view) {
    if (view == currentView()) return;
    
    // Toggle controls.
    $('.active', $viewControls).removeClass('active');
    $('.' + view, $viewControls).addClass('active');

    // Toggle actual view.
    $('#magazine-component').removeClass().addClass(view + '-active');

    // View specific setup.
    glimpse.FullscreenView.stop();

    if (view == ViewTypes.GRID) {
      glimpse.SpreadView.hideProductList();
      glimpse.GridView.resize();
    }
    else if (view == ViewTypes.FULLSCREEN) {
      glimpse.SpreadView.hideProductList();
      $(glimpse).trigger(glimpse.PageController.EventTypes.WILL_ENTER_FULLSCREEN);
      glimpse.FullscreenView.start();
    }
    else {
      glimpse.SpreadView.showProductList();
    }
  }

  function checkForResizeNeed() {
    if ($catalogueWrapper.is(':visible')) {
      if (prevCatWidth != $catalogueWrapper.width() || prevWinHeight != $(window).height()) {
        $(glimpse).trigger(glimpse.PageController.EventTypes.RESIZE_CATALOGUE);
        prevCatWidth = $catalogueWrapper.width();
        prevWinHeight = $(window).height();
      }
    }
  }

  function onHashChange() {
    if (skipNextHashChangeEvent) {
      skipNextHashChangeEvent = false;
      return;
    }

    var currentPage = getPageFromHash();
    if (currentView() == ViewTypes.GRID) {
      setView(ViewTypes.SPREAD);
      glimpse.SpreadView.setPage(currentPage);
    } else {
      glimpse.SpreadView.setPage(currentPage);
    }
  }

  function updateHash(e, data) {
    if (!data || !data.hash || data.hash == location.hash) return;

    skipNextHashChangeEvent = true;
    location.hash = data.hash;
  }


  return {
    init: init,
    EventTypes: EventTypes,
    ViewTypes: ViewTypes,
    getPageFromHash: getPageFromHash,
    currentView: currentView
  };

}());
