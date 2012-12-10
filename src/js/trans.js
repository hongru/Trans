// Trans for css3
// Thanks to reveal.js[https://github.com/hakimel/reveal.js]

var Trans = (function () {
    // vars
    var SLIDES_SELECTOR = '.reveal .slides section',
        HORIZONTAL_SLIDES_SELECTOR = '.reveal .slides>section',
		VERTICAL_SLIDES_SELECTOR = '.reveal .slides>section.present>section',
        
        indexh = 0,
        indexv = 0,
        tempNode = document.createElement('div'),
        support3DTransform = 'WebkitPerspective' in tempNode.style ||
								'MozPerspective' in tempNode.style ||
								'msPerspective' in tempNode.style ||
								'OPerspective' in tempNode.style ||
								'perspective' in tempNode.style,
        support2DTransform = 'WebkitTransform' in tempNode.style ||
								'MozTransform' in tempNode.style ||
								'msTransform' in tempNode.style ||
								'OTransform' in tempNode.style ||
								'transform' in tempNode.style,
        config = {
            history: false,
            center: true,
			transition: 'default'
        },
        dom = {},
        previousSlide,
        currentSlide;
        
    // private methods
    function extend (target, source, isOverwrite) {
        if (isOverwrite == undefined) isOverwrite = true;
        for (var k in source) {
            if (!(k in target) || isOverwrite) {
                target[k] = source[k]
            }
        }
        return target;
    }
        
    function hideAddressBar() {
		if( navigator.userAgent.match( /(iphone|ipod)/i ) ) {
			// Give the page some scrollable overflow
			document.documentElement.style.overflow = 'scroll';
			document.body.style.height = '120%';

			// Events that should trigger the address bar to hide
			window.addEventListener( 'load', removeAddressBar, false );
			window.addEventListener( 'orientationchange', removeAddressBar, false );
		}
	}
    function removeAddressBar() {
		setTimeout( function() {
			window.scrollTo( 0, 1 );
		}, 0 );
	}
    
    function setupDom() {
		dom.wrapper = document.querySelector( '.reveal' );
		dom.slides = document.querySelector( '.reveal .slides' );
	}
    
    function bindEvents () {
        window.addEventListener( 'load', layout, false );
        window.addEventListener( 'hashchange', onWindowHashChange, false );
		window.addEventListener( 'resize', onWindowResize, false );
    }
    
    function toArray( o ) {
		return Array.prototype.slice.call( o );
	}

	function each( targets, method, args ) {
		targets.forEach( function( el ) {
			el[method].apply( el, args );
		} );
	}
    
    function configure() {
		if( support3DTransform === false ) {
			config.transition = 'linear';
		}

		if( config.transition !== 'default' ) {
			dom.wrapper.classList.add( config.transition );
		}
	}
    
    function layout() {

		if( config.center ) {

			// Select all slides, vertical and horizontal
			var slides = toArray( document.querySelectorAll( SLIDES_SELECTOR ) );

			// Determine the minimum top offset for slides
			var minTop = -dom.wrapper.offsetHeight / 2;

			for( var i = 0, len = slides.length; i < len; i++ ) {
				var slide = slides[ i ];

				// Don't bother update invisible slides
				if( slide.style.display === 'none' ) {
					continue;
				}

				// Vertical stacks are not centered since their section 
				// children will be
				if( slide.classList.contains( 'stack' ) ) {
					slide.style.top = 0;
				}
				else {
					slide.style.top = Math.max( - ( slide.offsetHeight / 2 ) - 20, minTop ) + 'px';
				}
			}

		}

	}
    
    function getIndices( slide ) {
		// By default, return the current indices
		var h = indexh,
			v = indexv;

		// If a slide is specified, return the indices of that slide
		if( slide ) {
			var isVertical = !!slide.parentNode.nodeName.match( /section/gi );
			var slideh = isVertical ? slide.parentNode : slide;

			// Select all horizontal slides
			var horizontalSlides = toArray( document.querySelectorAll( HORIZONTAL_SLIDES_SELECTOR ) );

			// Now that we know which the horizontal slide is, get its index
			h = Math.max( horizontalSlides.indexOf( slideh ), 0 );

			// If this is a vertical slide, grab the vertical index
			if( isVertical ) {
				v = Math.max( toArray( slide.parentNode.children ).indexOf( slide ), 0 );
			}
		}

		return { h: h, v: v };
	}
    
    function readURL() {
		var hash = window.location.hash;

		// Attempt to parse the hash as either an index or name
		var bits = hash.slice( 2 ).split( '/' ),
			name = hash.replace( /#|\//gi, '' );

		// If the first bit is invalid and there is a name we can
		// assume that this is a named link
		if( isNaN( parseInt( bits[0], 10 ) ) && name.length ) {
			// Find the slide with the specified name
			var element = document.querySelector( '#' + name );

			if( element ) {
				// Find the position of the named slide and navigate to it
				var indices = getIndices( element );
				slide( indices.h, indices.v );
			}
			// If the slide doesn't exist, navigate to the current slide
			else {
				slide( indexh, indexv );
			}
		}
		else {
			// Read the index components of the hash
			var h = parseInt( bits[0], 10 ) || 0,
				v = parseInt( bits[1], 10 ) || 0;

			slide( h, v );
		}
	}
    
    function onWindowHashChange( event ) {
		readURL();
	}
	function onWindowResize( event ) {
		layout();
	}
    
    function getPreviousVerticalIndex( stack ) {
		if( stack && stack.classList.contains( 'stack' ) ) {
			return parseInt( stack.getAttribute( 'data-previous-indexv' ) || 0, 10 );
		}

		return 0;
	}
    function setPreviousVerticalIndex( stack, v ) {
		if( stack ) {
			stack.setAttribute( 'data-previous-indexv', v || 0 );
		}
	}
    
    function slide( h, v, f ) {
		previousSlide = currentSlide;
		var horizontalSlides = document.querySelectorAll( HORIZONTAL_SLIDES_SELECTOR );

		if( v === undefined ) {
			v = getPreviousVerticalIndex( horizontalSlides[ h ] );
		}

		if( previousSlide && previousSlide.parentNode && previousSlide.parentNode.classList.contains( 'stack' ) ) {
			setPreviousVerticalIndex( previousSlide.parentNode, indexv );
		}

		var indexhBefore = indexh,
			indexvBefore = indexv;

		// Activate and transition to the new slide
		indexh = updateSlides( HORIZONTAL_SLIDES_SELECTOR, h === undefined ? indexh : h );
		indexv = updateSlides( VERTICAL_SLIDES_SELECTOR, v === undefined ? indexv : v );

		layout();
        
		if( previousSlide ) {
			previousSlide.classList.remove( 'present' );
		}
	}
    
    function updateSlides( selector, index ) {
		var slides = toArray( document.querySelectorAll( selector ) ),
			slidesLength = slides.length;

		if( slidesLength ) {
        
			index = Math.max( Math.min( index, slidesLength - 1 ), 0 );

			for( var i = 0; i < slidesLength; i++ ) {
				var element = slides[i];

				slides[i].classList.remove( 'past' );
				slides[i].classList.remove( 'present' );
				slides[i].classList.remove( 'future' );

				if( i < index ) {
					// Any element previous to index is given the 'past' class
					slides[i].classList.add( 'past' );
				}
				else if( i > index ) {
					// Any element subsequent to index is given the 'future' class
					slides[i].classList.add( 'future' );
				}

				// If this element contains vertical slides
				if( element.querySelector( 'section' ) ) {
					slides[i].classList.add( 'stack' );
				}
			}

			// Mark the current slide as present
			slides[index].classList.add( 'present' );

		}
		else {
			index = 0;
		}

		return index;

	}
    
    // initialize
    function initialize (opt) {
        if( ( !support2DTransform && !support3DTransform ) ) {
			document.body.setAttribute( 'class', 'no-transforms' );

			return;
		}
        
        extend(config, opt);
        hideAddressBar();
        setupDom();
        bindEvents();
        configure();
		layout();
		readURL();
    }
    
    return {
        initialize: initialize
    }
    
})();