_Quick overview for configuring the magazine code package:_

After downloading the code you can initially preview the demo by opening index.html in a browser.

To customize the catalog with your own assets you'll need to make the following changes to index.html:

__Add your own pages:__
Modify the divs inside of the catalogue element `<div id="catalogue">` with your own images:

`<div page="6" imageurl="path/to/your/image"></div>`

You can add or remove as many pages as you want, just be sure the page attribute is accurate and that the images are all the same aspect ratio.
Note that some pages in the demo already have the background-image style set - this is required only for the first two pages, beyond that the images are loaded when they're about to appear.
You should also replace the thumbnail in the grid wrapper:

      <li>
         <a href="#page-2">    <!-- this hash tag format is required -->
           <div class="item">
             <div class="thumb">
               <div class="thumb-shadow"></div>
               <img class="thumb-img" src="page/to/your/page2thumbnail">
               <img class="thumb-img" src="page/to/your/page3thumbnail">
             </div>
             <span class="grid-index">2 - 3</span>
           </div>
         </a>
       </li>


__Add your own products/hotspots:__
This part is optional and you can delete the products or product list container element if you want. 
In the `<div class="product-list">` container you'll find a list of product items. The data attributes for each item control the following:

* data-x/data-y/data-width/data-height - these control the location (top left) and size of the spotlight that appears on the magazine when you hover over the item in the list. Since the magazine size is flexible these should all be values relative to the size of each page (e.g. data-x="0.2" means the left-most part of the spotlight is at 20% of that page's width).

* data-targetx and data-targety are similar values that contain the location of the hotspot icon that appears over the magazine.

* data-page assigns the product to specific page.

* data-id, data-uid, and ddkey are probably only relevant if you're working with an existing database of products. ddkey isn't required, but id and uid are needed. If you don't have a database to reference the product then data-id can be anything, but data-uid needs to be unique for that particular hotspot. If you're not sure just number them sequentially.

* Once that's done then you should enter your product name/price/thumbnail (40x40 works best).