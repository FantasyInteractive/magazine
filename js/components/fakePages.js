var glimpse = glimpse || {};

/**
 * @class FakePages
 * Creates fake pages around catalogue.
 */

/**
 * @param {Element} $context - the catalogue container.
 */
glimpse.FakePages = function($context, options) {
  this.$context = $context;
  this.currentPages = [0, 1];
  this.totalPages = 0;
  this.$leftFakes = [];
  this.$rightFakes = [];
  this.$leftShadow;
  this.$rightShadow;
  this.numFakePagesLeft = 0;
  this.numFakePagesRight = 0;

  this.opts = $.extend({
    zIndex: -1,
    maxFakePages: 3,
    pageClass: 'fake-page',
    shadowClass: 'fake-page-shadow'
  }, options);

  this.CONTAINER_ID = 'fake-pages';
  this.FAKE_PAGE_TEMPLATE = '<div class="' + this.opts.pageClass + '" style="<%STYLES%>'
                + 'display:none; position:absolute; width:1px">'
                +   '<div class="' + this.opts.shadowClass + '" style="<%SHADOW_STYLES%>'
                +   'position:relative; width:1px;"></div>'
                + '</div>';
};

glimpse.FakePages.EventTypes = {
  REFRESH_FAKE_PAGES: 'ProductHotspots::REFRESH_FAKE_PAGES',
  FAKE_PAGES_REFRESHED: 'ProductHotspots::FAKE_PAGES_REFRESHED'
};


glimpse.FakePages.prototype = {

  init: function(currentPage, totalPages) {

    if (currentPage%2 == 0) {
      this.currentPages = [currentPage, currentPage+1];
    } else {
      this.currentPages = [currentPage-1, currentPage];
    }
    this.totalPages = totalPages;

    this.createFakes();
    this.createCatalogueShadows();
    this.bindEvents();
    this.refresh();
  },

  fakePageOffsetLeft: function() {
    return 2*this.numFakePagesLeft;
  },

  fakePageOffsetRight: function() {
    return 2*this.numFakePagesRight;
  },

  createFakes: function() {
    var $container = this.createContainer();

    var fakePagesMarkup = '';
    for (var s = 0; s < 2; s++) {
      var side = (s == 0) ? 'left' : 'right';

      for (var page=1, m=(this.opts.maxFakePages); page <= m; page++) {
        fakePagesMarkup += this.makeFakePageMarkup(side, page);
      }
    }

    $container.append(fakePagesMarkup);

    var $fakes = $('.' + this.opts.pageClass, $container);
    this.$leftFakes = $fakes.slice(0, this.opts.maxFakePages);
    this.$rightFakes = $fakes.slice(this.opts.maxFakePages, 2*this.opts.maxFakePages);
  },

  createContainer: function() {
    this.$context.append('<div id="' + this.CONTAINER_ID + '" '
                       + 'style="z-index:' + this.opts.zIndex + ';"></div>');
    var $container = $('#' + this.CONTAINER_ID, this.$context);
    $container.css({
      'height': '100%',
      'left': '0',
      'position': 'absolute',
      'top': '0',
      'width': '100%'
    });

    return $container;
  },

  /**
   * Create markup for a fake page + shadow (just the edge of the page)
   * @param {String} side - 'left' or 'right'
   */
  makeFakePageMarkup: function(side, fakePageNum) {
    var sideOffset = -2*fakePageNum;
    var verticalOffset = 2*fakePageNum - 2;

    styles = side + ':' + sideOffset + 'px;'
           + 'top:'     + verticalOffset + 'px;'
           + 'bottom:'     + verticalOffset + 'px;';
    fakePageMarkup = this.FAKE_PAGE_TEMPLATE.replace('<%STYLES%>', styles);

    sideOffset = -1;
    verticalOffset = -1;
    side = (side == 'left') ? 'right' : 'left';

    shadowStyles = side + ':' + sideOffset + 'px;'
                 + 'top:'     + verticalOffset + 'px;'
                 + 'bottom:'     + verticalOffset + 'px;';
    fakePageMarkup = fakePageMarkup.replace('<%SHADOW_STYLES%>', shadowStyles);

    return fakePageMarkup;
  },

  createCatalogueShadows: function() {
    var $shadows = $('.shadows', this.$context.parent());
    this.$context.append($shadows);
    $shadows.show();

    this.$leftShadow = $('.shadows .left-shadow', this.$context);
    this.$rightShadow = $('.shadows .right-shadow', this.$context);

    // Prevent the shadow images from being dragged accidentally.
    this.$leftShadow.add(this.$rightShadow).on('dragstart', function(e) {
      e.preventDefault();
    });
  },

  bindEvents: function() {
    $(glimpse).on(glimpse.FakePages.EventTypes.REFRESH_FAKE_PAGES,
      $.proxy(this.refresh, this));
  },

  /**
   * Toggles display of fake pages to match current pages.
   * @param {Object} data - optionally contains pages array with 2 open pages: e.g. [2, 3]
   */
  refresh: function(event, data) {
    if (data && data.pages) {
      this.currentPages = data.pages;
    }

    var pagesToLeftBoundary = this.currentPages[0]/2;
    var leftPages = this.howManyFakesToDisplay(pagesToLeftBoundary);

    var pagesToRightBoundary = Math.floor(this.totalPages/2) - Math.floor(this.currentPages[1]/2);
    pagesToRightBoundary = this.currentPages[1] == 0 ? 0 : pagesToRightBoundary;
    var rightPages = this.howManyFakesToDisplay(pagesToRightBoundary);

    this.showPages(leftPages, rightPages);
    this.showShadows(pagesToLeftBoundary, pagesToRightBoundary);
  },

  howManyFakesToDisplay: function(pagesToBoundary) {
    var fakesToDisplay = Math.max(0, Math.min(this.opts.maxFakePages, pagesToBoundary-1));
    return fakesToDisplay;
  },

  showPages: function(fakesToDisplayLeft, fakesToDisplayRight) {
    this.numFakePagesLeft = fakesToDisplayLeft;
    this.numFakePagesRight = fakesToDisplayRight;

    for (var i=0, m=this.opts.maxFakePages; i<m; i++) {
      if (i < fakesToDisplayLeft) {
        $(this.$leftFakes[i]).fadeIn(150);
      } else {
        $(this.$leftFakes[i]).fadeOut(150);
      }

      if (i < fakesToDisplayRight) {
        $(this.$rightFakes[i]).fadeIn(150);
      } else {
        $(this.$rightFakes[i]).fadeOut(150);
      }
    }

    $(glimpse).trigger(glimpse.FakePages.EventTypes.FAKE_PAGES_REFRESHED);
  },

  showShadows: function(pagesToLeftBoundary, pagesToRightBoundary) {
    var leftOpacity = Math.min(1, Math.max(0, pagesToLeftBoundary - 1));
    var rightOpacity = Math.min(1, Math.max(0, pagesToRightBoundary - 1));
    this.$leftShadow.css('opacity', leftOpacity);
    this.$rightShadow.css('opacity', rightOpacity);
  }
};
