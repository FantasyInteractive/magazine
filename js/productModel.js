var glimpse = glimpse || {};

/**
 * @class ProductModel
 * Provides product/page data and formatting.
 */

glimpse.ProductModel = (function() {

  var productData = [];
  var productsByPage = {};
  var productsByUID = {};
  var originalProductPopupData = null;
  var popupTimeout = null;
  var POPUP_TIMEOUT_DURATION = 5000;


  function populate(products) {
    productData = [];
    productsByPage = {};

    var page, product;
    for (var i in products) {
      if (products[i]) {
        product = formatProductData(products[i]);
        page = product.page;

        productData.push(product);
        productsByUID[product.uid] = product;
        if (!productsByPage[page]) {
          productsByPage[page] = [];
        }
        productsByPage[page].push(products[i]);
      }
    }
  }

  function productsForPages(pages) {
    var products = [];
    var page;
    for (var i in pages) {
      page = pages[i];
      if (productsByPage[page]) {
        $.merge(products, productsByPage[page]);
      }
    }
    return products;
  }

  function productForUID(uid) {
    return productsByUID[uid];
  }

  function getProducts() {
    return productData;
  }

  /**
   * Converts product location to be relative to catalogue spread instead of a page.
   */
  function formatProductData(product) {
    product.x = product.x/2;
    product.width = product.width/2;

    product.hotspot = {
      x: product.targetx/2,
      y: product.targety
    }

    if (product.page%2 == 1) {
      product.x += 0.5;
      product.hotspot.x += 0.5;
    }

    product.center = {
      x: product.x + product.width/2,
      y: product.y + product.height/2
    }

    return product;
  }

  return {
    populate: populate,
    productsForPages: productsForPages,
    productForUID: productForUID,
    getProducts: getProducts,
  };

}());
