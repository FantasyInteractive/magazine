var glimpse = glimpse || {};

/**
 * @class ProductList
 * Controls the list of products.
 */

/**
 * @param {Element} $context - the list of products.
 */
glimpse.ProductList = function($context, options) {
  this.$context = $context;
  this.$list = $('ul', $context);
  this.opts = $.extend({
    onProductClickEvent: "ProductList::PRODUCT_CLICKED"
  }, options);
  this.currentProducts = [];
  this.isTouch = ('ontouchstart' in document.documentElement);
  this.productLeaveTimeout;
};

glimpse.ProductList.EventTypes = {
  UPDATE_PRODUCTS: "ProductList::UPDATE_PRODUCTS",
  CLEAR_SELECTION: "ProductList::CLEAR_SELECTION"
};

glimpse.ProductList.prototype = {

  init: function() {
    this.bindEvents();
    this.refresh();
  },

  bindEvents: function() {
    $('li', this.$context).on('click', $.proxy(this.onProductClick, this));

    if (!this.isTouch && !window.navigator.msMaxTouchPoints) {
      $('li', this.$context).on('mouseenter', $.proxy(this.onMouseenterProduct, this));
      $('li', this.$context).on('mouseleave', $.proxy(this.onMouseleaveProduct, this));
      $('ul', this.$context).on('mouseleave', $.proxy(this.onMouseleaveList, this));
    }

    $(glimpse).on(glimpse.ProductList.EventTypes.UPDATE_PRODUCTS,
      $.proxy(this.refresh, this));
    $(glimpse).on(glimpse.ProductList.EventTypes.CLEAR_SELECTION,
      $.proxy(this.clearSelectedProduct, this));
    $(glimpse).on(glimpse.PageController.EventTypes.WILL_ENTER_FULLSCREEN,
      $.proxy(this.onFullscreenMode, this));
    $(glimpse).on(glimpse.PageController.EventTypes.CLICK_BACKGROUND, 
      $.proxy(this.clearSelectedProduct, this));
  },

  setActiveProduct: function($selectedProduct) {
    if ($selectedProduct.hasClass('active')) {
      $selectedProduct.removeClass('active');
    } else {
      $('.active', this.$context).removeClass('active');
      $selectedProduct.addClass('active');
    }
  },

  clearSelectedProduct: function() {
    $('.active', this.$context).removeClass('active');
  },

  onMouseenterProduct: function(event) {
    clearTimeout(this.productLeaveTimeout);
    var $selectedProduct = $(event.currentTarget);
    this.requestHighlight($selectedProduct);
  },

  onMouseleaveProduct: function(event) {
    var self = this;
    this.productLeaveTimeout = setTimeout(function() {
      self.onMouseleaveList(event);
    }, 50);
  },

  onMouseleaveList: function(event) {
    this.clearSelectedProduct();
    $(glimpse).trigger(glimpse.ProductMask.EventTypes.HIDE_PRODUCT_HIGHLIGHT);
  },

  onProductClick: function(event) {
    var $selectedProduct = $(event.currentTarget);
    
    if (this.isTouch || window.navigator.msMaxTouchPoints) {
      this.setActiveProduct($selectedProduct);
      this.requestHighlight($selectedProduct);
    }
    else {
      this.requestPopup($selectedProduct);
    }
  },

  requestHighlight: function($selectedProduct) {
    var formattedData = glimpse.ProductModel.productForUID($selectedProduct.data().uid);

    $(glimpse).trigger(glimpse.ProductMask.EventTypes.TOGGLE_PRODUCT_HIGHLIGHT, {
      product: formattedData,
      active: $selectedProduct.hasClass('active')
    });
  },

  requestPopup: function($selectedProduct) {
    var uid = $selectedProduct.data('uid');
    console.log('Do something with product uid: ' + uid);
  },

  refresh: function(event, data) {
    if (data && data.products) {
      this.setCurrentProducts(data.products);
    }

    var $product;
    var $productImage;
    var uid;
    var ddkey;
    var currentProducts = this.currentProducts;
    var displayedDDKeys = [];

    var productsToDisplay = [];
    var productsToHide = [];

    $('li', this.$context).each(function() {
      $product = $(this);
      uid = $product.data('uid');
      ddkey = $product.attr('ddkey');

      if (-1 !== $.inArray(uid, currentProducts) && -1 == $.inArray(ddkey, displayedDDKeys)) {
        displayedDDKeys.push(ddkey);

        $productImage = $('img', $product);
        if ($productImage.attr('imageurl')) {
          $productImage.attr('src', $productImage.attr('imageurl'));
          $productImage.removeAttr('imageurl');
        }
        productsToDisplay.push(this);
      }
      else {
        productsToHide.push(this);
      }
    });

    $(productsToDisplay).show();
    $(productsToHide).hide();

    $('.active', this.$context).removeClass('active');
  },

  setCurrentProducts: function(products) {
    this.currentProducts = [];
    for (var i in products) {
      this.currentProducts.push(products[i].uid);
    }
  },

  onFullscreenMode: function() {
    $('.active', this.$context).removeClass('active');
  },

  hide: function() {
    this.$context.animate({'right': -this.$context.width()}, 250);
  },

  show: function() {
    this.$context.animate({'right': 0}, 250);
  }
};
