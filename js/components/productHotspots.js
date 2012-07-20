var glimpse = glimpse || {};

/**
 * @class ProductHotspots
 * Creates and controls the hotspots and their container.
 */

/**
 * @param {Element} $context - the magazine container.
 */
glimpse.ProductHotspots = function($context, options) {
  this.$context = $context;
  this.$hotspotContainer;
  this.opts = $.extend({
    zIndex: 2001,
    activeZIndex: 2003,
    onMouseoverCallback: null,
    onMouseoutCallback: null
  }, options);
  this.currentProducts = [];
  this.HOTSPOT_TEMPLATE = '<div class="hotspot" ddkey="<%DDKEY%>" data-uid="<%UID%>"'
                        + 'style="top:<%TOP%>%; left:<%LEFT%>%; position:absolute; '
                        + 'display:none;"></div>';
  this.suppressed = false;
  this.isTouch = (('ontouchstart' in document.documentElement) || window.navigator.msMaxTouchPoints);
};

glimpse.ProductHotspots.EventTypes = {
  UPDATE_PRODUCTS: 'ProductHotspots::UPDATE_PRODUCTS',
  SUPPRESS_HOTSPOTS: 'ProductHotspots::SUPPRESS_HOTSPOTS',
  UNSUPPRESS_HOTSPOTS: 'ProductHotspots::UNSUPPRESS_HOTSPOTS',
  MAKE_HOTSPOTS_INVISIBLE: 'ProductHotspots::MAKE_HOTSPOTS_INVISIBLE',
  MAKE_HOTSPOTS_VISIBLE: 'ProductHotspots::MAKE_HOTSPOTS_VISIBLE'
};


glimpse.ProductHotspots.prototype = {

  /**
   * @param {Array} products - Optional product list to populate in bulk.
   */
  init: function(products) {
    this.createContainer();
    this.bindEvents();

    if (products) {
      this.addBulkHotspots(products);
    }
  },

  createContainer: function() {
    this.$context.append('<div id="hotspots"></div>');
    this.$hotspotContainer = $('#hotspots', this.$context);
    this.$hotspotContainer.css('z-index', this.opts.zIndex);
  },

  bindEvents: function() {

    if (this.isTouch) {
      this.$hotspotContainer.on('touchstart', '.hotspot', $.proxy(this.onHotspotPress, this));
      this.$hotspotContainer.on('touchmove', '.hotspot', function(){ return false; });
      this.$hotspotContainer.on('touchend', '.hotspot', function(){ return false; });
    }
    else {
      this.$hotspotContainer.on('mousemove', $.proxy(this.show, this));
      this.$hotspotContainer.on('mouseenter', $.proxy(this.show, this));
      this.$hotspotContainer.on('mouseleave', $.proxy(this.hide, this));
    }

    this.$hotspotContainer.on('click', '.hotspot', $.proxy(this.onHotspotPress, this));
    this.$hotspotContainer.on('mouseenter', '.hotspot', this.opts.onMouseoverCallback);
    this.$hotspotContainer.on('mouseleave', '.hotspot', this.opts.onMouseoutCallback);
    this.$hotspotContainer.on('click', $.proxy(this.toggle, this));
    this.$hotspotContainer.on('touchend', $.proxy(this.onTouchend, this));
    this.$hotspotContainer.on('MSPointerUp', $.proxy(this.onTouchend, this));

    $(glimpse).on(glimpse.ProductHotspots.EventTypes.UPDATE_PRODUCTS,
      $.proxy(this.refresh, this));
    $(glimpse).on(glimpse.ProductHotspots.EventTypes.SUPPRESS_HOTSPOTS, 
      $.proxy(this.suppress, this));
    $(glimpse).on(glimpse.ProductHotspots.EventTypes.UNSUPPRESS_HOTSPOTS,
      $.proxy(this.unsuppress, this));
    $(glimpse).on(glimpse.ProductHotspots.EventTypes.MAKE_HOTSPOTS_INVISIBLE, 
      $.proxy(this.makeInvisible, this));
    $(glimpse).on(glimpse.ProductHotspots.EventTypes.MAKE_HOTSPOTS_VISIBLE,
      $.proxy(this.makeVisible, this));
    $(glimpse).on(glimpse.PageController.EventTypes.CLICK_BACKGROUND, $.proxy(this.hide, this));
  },

  /**
   * Tries to set current products and sets display for hotspots to match.
   * @param {Object} data - Optionally include data.products to update current products.
   */
  refresh: function(event, data) {
    if (data && data.products) {
      this.setCurrentProducts(data.products);
    }

    var $hotspot;
    var uid;
    var currentProducts = this.currentProducts;

    var hotspotsToDisplay = [];
    var hotspotsToHide = [];

    $('.hotspot', this.$hotspotContainer).each(function() {
      $hotspot = $(this);
      uid = $hotspot.data('uid');

      if (-1 !== $.inArray(uid, currentProducts)) {
        hotspotsToDisplay.push(this);
      }
      else {
        hotspotsToHide.push(this);
      }
    });

    $(hotspotsToDisplay).show();
    $(hotspotsToHide).hide();
    this.hide();
  },

  setCurrentProducts: function(products) {
    this.currentProducts = [];
    for (var i in products) {
      this.currentProducts.push(products[i].uid);
    }
  },

  createHotspotMarkup: function(product) {
    var hotspot = this.HOTSPOT_TEMPLATE;
    hotspot = hotspot.replace('<%DDKEY%>', product.ddkey);
    hotspot = hotspot.replace('<%UID%>', product.uid);
    hotspot = hotspot.replace('<%TOP%>', product.hotspot.y*100);
    hotspot = hotspot.replace('<%LEFT%>', product.hotspot.x*100);
    return hotspot;
  },

  /**
   * Adds a hotspot element.
   * @param {Object} product - glimpse.ProductModel.product.
   */
  addHotspot: function(product) {
    var hotspot = this.createHotspotMarkup(product);
    this.$hotspotContainer.append(hotspot);
    this.refresh();
  },

  addBulkHotspots: function(products) {
    var hotspots = '';
    for (var i in products) {
      hotspots += this.createHotspotMarkup(products[i]);
    }
    this.$hotspotContainer.append(hotspots);
    this.refresh();
  },

  // Hides hotspots and prevents them from being shown.
  suppress: function() {
    this.suppressed = true;
    this.hide();
    return false;
  },

  unsuppress: function() {
    this.suppressed = false;
  },

  show: function() {
    if (this.suppressed) return;

    this.$hotspotContainer.css({
      'opacity': 1,
      'z-index': this.opts.activeZIndex
    });
  },

  hide: function() {
    this.$hotspotContainer.css({
      'opacity': 0,
      'z-index': this.opts.zIndex
    });
  },

  makeInvisible: function() {
    this.$hotspotContainer.addClass('invisible');
  },

  makeVisible: function() {
    this.$hotspotContainer.removeClass('invisible');
  },

  toggle: function(event) {
    if (this.suppressed) return;
    
    if (this.$hotspotContainer.css('opacity') < 1) {
      this.show();
    } else {
      this.hide();
    }
  },

  onTouchend: function(event) {
    this.suppressed = false;
  },

  onHotspotPress: function(event) {
    var uid = $(event.currentTarget).data('uid');
    console.log('Do something with product uid: ' + uid);

    // Only bubble if hotspots need to be revealed.
    return (this.$hotspotContainer.css('opacity') < 1);
  },
};
