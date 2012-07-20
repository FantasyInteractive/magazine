var glimpse = glimpse || {};

glimpse.GridView = (function() {

	var $view;
	var $wrapper;
	var $container;
	var $items;
	var $right;
	var $left;
	var $grids = [];
	var _currentGridIndex = 0;
	var _totalInGrid = 0;

	function init() {

		$view = $('.grid-view');
		$wrapper = $('.grid-view-wrapper');
		$container = $('.grid-view .container');
		$items = $view.find('li');
		$right = $wrapper.find('.nav.arrow.right');
		$left = $wrapper.find('.nav.arrow.left');

		$right.on('click', $.proxy(clicked, this));
		$left.on('click', $.proxy(clicked, this));
		$(window).on('resize', $.throttle(150, resize));
		$(document).on('click', $items, {}, clickedThumb); 

		resize();
	}

	function clicked(event) {
		event.preventDefault();
		event.stopPropagation();

		if($(event.currentTarget).hasClass('right') && _currentGridIndex < $grids.length-1) {
			++_currentGridIndex;
			$container.stop(true, false);
			$container.animate({
				left: -(_currentGridIndex * $view.outerWidth()) + 'px'
			}, 400);
		}
		else if($(event.currentTarget).hasClass('left') && _currentGridIndex > 0) {
			--_currentGridIndex;
			$container.stop(true, false);
			$container.animate({
				left: -(_currentGridIndex * $view.outerWidth()) + 'px'
			}, 400);
		}

		setButtonStatus();
	}

	// Manually requests a page change if there won't be a hash change.
	function clickedThumb(event) {
		var destination = $(event.currentTarget).find('a')[0].href;
		if (destination == location.href) {
			$(glimpse).trigger(glimpse.PageController.EventTypes.REQUEST_VIEW_CHANGE, {
				view: glimpse.PageController.ViewTypes.SPREAD
			});
		}
	}

	function setButtonStatus() {
		if(_currentGridIndex >= $grids.length-1) $right.addClass('disabled');
		else $right.removeClass('disabled');

		if(_currentGridIndex <= 0) $left.addClass('disabled');
		else $left.removeClass('disabled');
	}

	function refresh() {
		var itemWidth = $($items[0]).outerWidth();
		var itemHeight = $($items[0]).outerHeight();
		var wrapperWidth = $wrapper.outerWidth();
		var wrapperHeight = $wrapper.outerHeight();
		var cols = Math.floor(wrapperWidth / itemWidth);
		var rows = Math.floor(wrapperHeight / itemHeight);
		var totalInGrid = cols * rows;
		var totalGrids = Math.ceil($items.length / totalInGrid);
		var padding = (wrapperWidth - (cols * itemWidth)) * 0.5;
		$view.css({
			height: (rows * itemHeight) + 'px',
			width: (cols * itemWidth) + 'px'
		});
		var viewWidth = $view.outerWidth();
		var viewHeight = $view.outerHeight();

		$right.css({right: padding - 35 + 'px'});
		$left.css({left: padding - 35 + 'px'});

		_currentGridIndex = Math.min(totalGrids-1, _currentGridIndex);
		$container.css({
			left: -(_currentGridIndex * $view.outerWidth()) + 'px'
		});

		if(_totalInGrid == totalInGrid) {
			var k = $grids.length;
			while(--k > -1) {
				$grids[k].css({
					height: viewHeight + 'px',
					left: k * viewWidth + 'px',
					position: 'absolute',
					width: viewWidth + 'px'
				});
			}
			setButtonStatus();
			return;
		}
		_totalInGrid = totalInGrid;
		
		$items.remove();
		var l = $grids.length;
		while(--l > -1) $grids[l].remove();
		$grids = [];
		var j = 0;

		for(var i = 0; i < totalGrids; ++i) {
			
			var $grid = $('<div></div>');
			$grid.css({
				height: viewHeight + 'px',
				left: i * viewWidth + 'px',
				position: 'absolute',
				width: viewWidth + 'px'
			});

			$container.append($grid);
			$grids.push($grid);

			for(j; j < (totalInGrid * (i + 1)) && j < $items.length; ++j) {
				$grid.append($items[j]);
			}
		}

		setButtonStatus();
	}

	function resize(event) {
	    var topOffset = $('.grid-page-count').outerHeight() + $('.tf_browse_page_header').outerHeight();
	    topOffset += parseInt($wrapper.css('margin-top'));
	    var bottomOffset = $('.footer').outerHeight() + parseInt($wrapper.css('margin-bottom'));
	    var availableHeight = $(window).height() - topOffset - bottomOffset;

	    $wrapper.height(availableHeight);
		refresh();
	}

	return {
		init: init,
		refresh: refresh,
		resize: resize
	};

}());