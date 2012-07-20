var glimpse = glimpse || {};

glimpse.SpreadView = (function() {

  var maxPages = 1;
  var currentPage = 1;
  var productMask;
  var productList;
  var catalogueW = 472*2;
  var catalogueH = 620;
  var MAGAZINE_NAV_HOTSPOT_Z_INDEX = 2002;
  var PRODUCT_HOTSPOT_Z_INDEX = 2001
  var PRODUCT_MASK_Z_INDEX = 2004;
  var fakePageController;
  var is_touch = ('ontouchstart' in document.documentElement);

  var $catalogue;
  var $navLeft;
  var $navRight;

  var EventTypes = {
    CENTER_CATALOGUE: 'SpreadView::CENTER_CATALOGUE',
    WILL_TURN_PAGE: 'PageController::WILL_TURN_PAGE'
  };

  function init(page, numPages) {

    $catalogue = $('#catalogue');
    maxPages = numPages;
    currentPage = page;

    setCatalogueSizeWithFirstPageImage();
    setupCatalogue();
    setupFakePages();
    setupProductMask();
    setupProductList();
    setupProductHotspots();

    onPageTurn($catalogue.turn('view'));
  }

  function setupCatalogue() {
    var useTranslate3d = false;
    if (navigator.userAgent.match(/(iPod|iPhone|iPad)/)) {
      useTranslate3d = true;
    }

    $catalogue.turn({
      page: currentPage,
      display: 'double',
      acceleration: useTranslate3d,
      duration: 350,
      gradients: true,
      spine: true,
      elevation:50,
      when: {
        turn: function(e, page) {
          $(glimpse).trigger(glimpse.SpreadView.EventTypes.WILL_TURN_PAGE);
          centerCatalogue(page);
          $(glimpse).trigger(glimpse.ProductMask.EventTypes.HIDE_PRODUCT_HIGHLIGHT);
          $(glimpse).trigger(glimpse.ProductHotspots.EventTypes.SUPPRESS_HOTSPOTS);
        },
        turned: function(e) {
          var pages = $(this).turn('view');
          onPageTurn(pages);
        },
        pressed: function(e) {
          $(glimpse).trigger(glimpse.ProductMask.EventTypes.HIDE_PRODUCT_HIGHLIGHT);
          $(glimpse).trigger(glimpse.ProductHotspots.EventTypes.SUPPRESS_HOTSPOTS);
        },
        hideFoldedPage: function() {
          if (!productMask.isActive()) {
            $(glimpse).trigger(glimpse.ProductHotspots.EventTypes.UNSUPPRESS_HOTSPOTS);
          }
        }
      }
    });
    var $win = $(window);
    resizeCatalogue();
    $(glimpse).on(glimpse.PageController.EventTypes.RESIZE_CATALOGUE, resizeCatalogue);
    $(glimpse).on(glimpse.FakePages.EventTypes.FAKE_PAGES_REFRESHED, updatePaginationForFakePages);
    $(document).on('keydown', onKeyPress);
    setupPageNav();
  }

  function onKeyPress(e) {
    var keyCode = e.keyCode || e.which,
        arrow = {left: 37, up: 38, right: 39, down: 40 };
    switch (keyCode) {
      case 37:
        $catalogue.turn('previous');
        break;
      case 39:
        $catalogue.turn('next');
        break;
    }
  }

  function setupPageNav() {

    var pageNavMarkup = '<a href="#" class="nav arrow left"></a>'
                      + '<a href="#" class="nav arrow right"></a>';
    $catalogue.append(pageNavMarkup);

    $navLeft = $('.nav.arrow.left', $catalogue);
    $navRight = $('.nav.arrow.right', $catalogue);

    $navLeft.add($navRight).css({
      'z-index': MAGAZINE_NAV_HOTSPOT_Z_INDEX
    });

    $navLeft.on('click', function(e) {
      e.preventDefault();
      var page = Math.max(0, ($catalogue.turn('view')[0] - 1));
      alertFakePagesEarly(page);
      $catalogue.turn('previous');
      return false;
    });

    $navRight.on('click', function(e) {
      e.preventDefault();
      var page = Math.max(0, ($catalogue.turn('view')[1] + 1));
      alertFakePagesEarly(page); 
      $catalogue.turn('next');
      return false;
    });
  }

  function setCatalogueSizeWithFirstPageImage() {
    var $firstPage = $($catalogue.children()[1]);
    var backgroundString = $firstPage.css('background-image');
    backgroundString = backgroundString.replace(/"/g, '');
    var urlRegex = /url\(([^)]*)\)/;
    var match = urlRegex.exec(backgroundString);

    if (match.length > 0) {
     var img = document.createElement("img");
     img.onload = setCatalogueSizeWithLoadedImage;
     img.src = match[1];
    }

    function setCatalogueSizeWithLoadedImage() {
      catalogueW = img.width * 2;
      catalogueH = img.height;
      resizeCatalogue();
    }
  }

  function resizeCatalogue() {
    var topOffset = $catalogue.offset().top - parseInt($catalogue.css('margin-top'));
    var bottomOffset = parseInt($('.catalogue-wrapper').css('margin-bottom'));

    if (glimpse.PageController.currentView() != glimpse.PageController.ViewTypes.FULLSCREEN) {
      bottomOffset += $('.footer').outerHeight();
    }

    var availableHeight = $('body').height() - topOffset - bottomOffset;
    var availableWidth = $('.catalogue-wrapper').width();

    var catalogueRatio = catalogueW / catalogueH;
    var availableRatio = availableWidth / availableHeight;

    var newH = 0;
    var newW = 0;

    if (catalogueRatio > availableRatio) {
      newW = availableWidth - 80;
      newH = catalogueH * newW/catalogueW;
      $catalogue.css('margin-top', (availableHeight - newH)/2);
    } else {
      newH = availableHeight - 28;
      newW = catalogueW * newH/catalogueH;
      $catalogue.css('margin-top', 14);
    }
    newW = Math.round(newW);
    newH = Math.round(newH);

    $catalogue.turn('size', newW, newH);
    centerCatalogue();
  }

  function getImageUrlForPage(pageNum) {
    var backgroundString = $('.p' + pageNum).css('background-image');
    if (backgroundString) {
      backgroundString = backgroundString.replace(/"/g, '');
      var urlRegex = /url\(([^)]*)\)/;
      var match = urlRegex.exec(backgroundString);

      if (match.length > 0) {
        return match[1];
      }
    }
    return null;
  }

  function setupFakePages() {
    fakePageController = new glimpse.FakePages($catalogue, {
      zIndex: -1,
      maxFakePages: 3
    });
    fakePageController.init(currentPage, maxPages);
  }

  function setupProductMask() {
    productMask = new glimpse.ProductMask($catalogue, {
      zIndex: PRODUCT_MASK_Z_INDEX,
      lastPage: maxPages,
      onActivate: function() {
        $(glimpse).trigger(glimpse.ProductHotspots.EventTypes.MAKE_HOTSPOTS_INVISIBLE);
      },
      onDeactivate: function() {
        $(glimpse).trigger(glimpse.ProductHotspots.EventTypes.MAKE_HOTSPOTS_VISIBLE);
      },
      suppressCatalogue: suppressCatalogueMove, 
      unsuppressCatalogue: unsuppressCatalogueMove
    });
    productMask.init();
  }

  function setupProductList() {
    productList = new glimpse.ProductList($('.product-list'));
    productList.init();
  }

  function setupProductHotspots() {
    var hotspots = new glimpse.ProductHotspots($catalogue, {
      zIndex: PRODUCT_HOTSPOT_Z_INDEX,
      activeZIndex: MAGAZINE_NAV_HOTSPOT_Z_INDEX + 1,
      onMouseoverCallback: suppressCatalogueMove,
      onMouseoutCallback: unsuppressCatalogueMove
    });
    var products = glimpse.ProductModel.getProducts();
    hotspots.init(products);
  }

  function suppressCatalogueMove() {
    $catalogue.turn('suppressMove', true);
  }

  function unsuppressCatalogueMove() {
    $catalogue.turn('suppressMove', false);
  }

  function onPageTurn(pages) {
    var productData = glimpse.ProductModel.productsForPages(pages);
    var products = {
      products: productData
    };
    $(glimpse).trigger(glimpse.ProductHotspots.EventTypes.UPDATE_PRODUCTS, products);
    $(glimpse).trigger(glimpse.ProductList.EventTypes.UPDATE_PRODUCTS, products);
    $(glimpse).trigger(glimpse.FakePages.EventTypes.REFRESH_FAKE_PAGES, {pages: pages});
    $(glimpse).trigger(glimpse.PageController.EventTypes.REQUEST_HASH_CHANGE, {
      hash: '#page-' + $catalogue.turn('page')
    });
    updatePageDisplay(pages);
  }

  function centerCatalogue(page) {
    var page = page || $catalogue.turn('page');
    var offset = 0.25*$catalogue.width() + 'px';

    if (page == 1) {
      offset = '-' + offset;
    }
    else if (page != maxPages) {
      offset = 0;
    }

    var left = $catalogue.css('left');
    var change = Math.abs(offset - parseInt(left));

    // Avoid animation ahead of initial resizing.
    if (isNaN(change) && left != '0px') {
      $catalogue.css('left', offset);
    } else {
      $catalogue.animate({'left': offset}, 250);
    }

    updatePagination(parseInt(offset));
    $(glimpse).trigger(glimpse.SpreadView.EventTypes.CENTER_CATALOGUE, {'offset':offset});
  }

  function updatePagination(offset) {
    if (!$navLeft || !$navRight) return;

    $navLeft.add($navRight).removeClass('disabled');

    if (offset < 0) {
      $navLeft.addClass('disabled');
    }
    else if (offset > 0) {
      $navRight.addClass('disabled');
    }

    updatePaginationForFakePages();
  }

  function updatePaginationForFakePages() {
    if (fakePageController) {
      $navRight.css('right', (-28 - fakePageController.fakePageOffsetRight()) +'px');
      $navLeft.css('left', (-28 - fakePageController.fakePageOffsetLeft()) +'px');
    }
  }

  function updatePageDisplay(pages) {
    var pagesString = '';

    if (pages[0] == 0) {
      pagesString = pages[1];
    }
    else if (pages[1] == 0) {
      pagesString = pages[0];
    }
    else {
      pagesString = pages[0] + '-' + pages[1];
    }

    $('.page-display span').html(pagesString);
  }

  function setPage(page) {
    var currentPages = $catalogue.turn('view');
    if (-1 == $.inArray(page, currentPages) && $catalogue.turn('hasPage', page)) {
      alertFakePagesEarly(page);
      $catalogue.turn('page', page);
    }
  }

  function alertFakePagesEarly(page) {
    if (page == 1 || page == maxPages) {
      var newPages = [];
      
      if (page%2 == 0) {
        newPages = [page, 0];
      } else {
        newPages = [page-1, page];
      }
      $(glimpse).trigger(glimpse.FakePages.EventTypes.REFRESH_FAKE_PAGES, {pages: newPages});
    }
  }

  function hideProductList() {
    productList.hide();
  }

  function showProductList() {
    productList.show(); 
  }


  return {
    init: init,
    setPage: setPage,
    hideProductList: hideProductList,
    showProductList: showProductList,
    getImageUrlForPage: getImageUrlForPage,
    EventTypes: EventTypes
  };

}());
