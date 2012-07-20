var glimpse = glimpse || {};

/**
 * @class ProductMask
 * Creates a canvas mask to spotlight products with.
 */

/**
 * @param {Element} $context - the catalogue container.
 */
glimpse.ProductMask = function($context, options) {
  this.$context = $context;
  this.$canvas;
  this.ctx;
  this.currentProduct;
  this.sides = {
    LEFT: 'left',
    RIGHT: 'right',
    BOTH: 'both'
  };
  this.side = this.sides.BOTH;
  this.is_touch = ('ontouchstart' in document.documentElement);

  this.opts = $.extend({
    zIndex: 2000,
    fadeTime: 350,
    flashDuration: 1800,
    lastPage: 1,
    maskFill: 'rgba(0,0,0, 0.85)',
    strokeFill: 'rgba(0,0,0, 0.8)',
    onActivate: function() {},
    onDeactivate: function() {},
    suppressCatalogue: function() {},
    unsuppressCatalogue: function() {}
  }, options);
};

glimpse.ProductMask.EventTypes = {
  TOGGLE_PRODUCT_HIGHLIGHT: 'ProductMask::TOGGLE_PRODUCT_HIGHLIGHT',
  HIDE_PRODUCT_HIGHLIGHT: 'ProductMask::HIDE_PRODUCT_HIGHLIGHT'
};


glimpse.ProductMask.prototype = {

  init: function() {
    this.createMaskingCanvas();
    this.bindEvents();
  },

  createMaskingCanvas: function() {
    this.$context.append('<canvas id="product-mask"></canvas>');
    this.$canvas = $('#product-mask', this.$context);
    this.ctx = this.$canvas[0].getContext('2d');
    this.$canvas.attr({
      'width': this.$context.width(),
      'height': this.$context.height()
    });
    this.$canvas.css({
      'display': 'none',
      'position': 'absolute',
      'top': 0,
      'left': 0,
      'z-index': this.opts.zIndex
    });
  },

  bindEvents: function() {
    $(glimpse).on(glimpse.ProductMask.EventTypes.TOGGLE_PRODUCT_HIGHLIGHT, 
      $.proxy(this.toggleMask, this));
    $(glimpse).on(glimpse.ProductMask.EventTypes.HIDE_PRODUCT_HIGHLIGHT, 
      $.proxy(this.hideMask, this));
    $(glimpse).on(glimpse.PageController.EventTypes.RESIZE_CATALOGUE,
      $.proxy(this.resize, this));
    $(glimpse).on(glimpse.PageController.EventTypes.WILL_ENTER_FULLSCREEN,
      $.proxy(this.onFullscreenMode, this));
    $(glimpse).on(glimpse.PageController.EventTypes.CLICK_BACKGROUND, $.proxy(this.hideMask, this));
    this.$canvas.on('click', $.proxy(this.onCanvasClick, this));
  },

  resize: function(event) {
    this.$canvas.attr({
      'width': this.$context.width(),
      'height': this.$context.height()
    });

    if (this.currentProduct) {
      this.drawMask(this.currentProduct);
    }
  },

  hideMask: function(event) {
    this.$canvas.stop();
    this.opts.onDeactivate();
    this.$canvas.fadeOut(this.opts.fadeTime);
    this.currentProduct = null;

    if (this.is_touch) {
      this.opts.unsuppressCatalogue();
    }
  },

  onFullscreenMode: function() {
    this.hideMask();
    this.currentProduct = null;
  },

  checkBounds: function(pageX, pageY) {
    if (!this.currentProduct) return;
    
    // Click location relative to canvas.
    var cX = pageX - this.$canvas.offset().left;
    var cY = pageY- this.$canvas.offset().top;

    // Bounds of current product.
    var product = this.currentProduct,
        sW = this.$canvas.width(),
        sH = this.$canvas.height(),
        bW = 1.5*sW*product.width,
        bH = 1.5*sH*product.height,
        bX = sW*product.center.x - 0.5*bW,
        bY = sH*product.center.y - 0.5*bH;

    if (bX < cX && cX < (bX + bW)) {
      if (bY < cY && cY < (bY + bH)) {
        return true;
      }
    }
    return false;
  },

  onCanvasClick: function(event) {
    if (this.checkBounds(event.pageX, event.pageY)) {
      console.log('Do something with product uid: ' + this.currentProduct.uid);
    } else {
      this.hideMask();
      $(glimpse).trigger(glimpse.ProductList.EventTypes.CLEAR_SELECTION);
    }
    return false;
  },

  /**
   * @param {Object} data.product - contains: x, y, radius.
   */
  toggleMask: function(event, data) {
    if (!data || !data.product || !data.product.x) return;

    var shouldHideMask = (this.currentProduct == data.product);
    if (data.active) {
      shouldHideMask = !data.active;
    }

    if (shouldHideMask) {
      this.hideMask();
      this.currentProduct = null;
    }
    else {
      if (data.product.page == 1) {
        this.side = this.sides.RIGHT;
      } else if (data.product.page == this.opts.lastPage && this.opts.lastPage%2 == 0) {
        this.side = this.sides.LEFT;
      } else {
        this.side = this.sides.BOTH;
      }
      this.currentProduct = data.product;
      this.drawMask(this.currentProduct);
      this.$canvas.fadeIn(this.opts.fadeTime);
    }
  },

  drawMask: function(product) {
    if (this.is_touch) {
      this.opts.suppressCatalogue();
    }

    this.opts.onActivate();

    // Current spreadSize.
    var sW = this.$canvas.width();
    var sH = this.$canvas.height();

    this.ctx.clearRect(0, 0, sW, sH);
    this.drawHighlightOval(product, sW, sH);  
    this.drawMaskAroundHighlight(sW, sH);
  },

  /**
   * Draws an opaque rectangle for the product.
   * @param {Object} product - contains: x, y, width, height.
   */
  drawHighlightRect: function(product, sW, sH) {
    this.ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
    this.ctx.beginPath();
    this.ctx.fillRect(sW*product.x, sH*product.y, sW*product.width, sH*product.height);
    this.ctx.closePath();
    this.ctx.fill();
  },

  // Draw mask everywhere but the opaque highlight (and remove it).
  drawMaskAroundHighlight: function(sW, sH) {
    // Determine which page(s) to cover.
    var widthDenominator = (this.side == this.sides.BOTH) ? 1 : 2;
    var width = sW/widthDenominator;
    var x = this.side == (this.sides.RIGHT) ? width : 0;

    this.ctx.globalCompositeOperation = 'source-out';
    this.ctx.fillStyle = this.opts.maskFill;
    this.ctx.fillRect(x, 0, width, sH);
    this.ctx.globalCompositeOperation = 'source-over';
  },

  /**
   * Draws an opaque oval for the product.
   * @param {Object} product - contains: center.x, center.y, width, height.
   */
  drawHighlightOval: function(product, sW, sH) {
    this.ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
    var yScale = (sH*product.height)/(sW*product.width);


    this.ctx.save();
    this.ctx.scale(1, yScale);
    this.ctx.beginPath();
    this.ctx.arc(sW*product.center.x,
                sH*product.center.y / yScale,
                1.5*sW*product.width/2,
                0, 2 * Math.PI, true);
    this.ctx.closePath();
    this.ctx.restore();
    this.ctx.fill();
  },

  isActive: function() {
    return this.$canvas.is(':visible');
  }

};
