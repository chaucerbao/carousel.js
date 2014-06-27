(function($) {
  'use strict';

  var prefix = 'carousel',
    defaults = {
      slideshow: false,
      interval: 3000,
      debug: false
    };

  $.fn.carousel = function(options) {
    var config = $.extend(defaults, options),
      $parent = $(this),
      $carousel = $parent.find('.' + prefix),
      $slides = $carousel.find('> *'),
      slideWidth = $slides.first().outerWidth(true),
      isTransitioning = false,
      isPrevious = false,
      isPlaying = false,
      slideshow;

    $slides.addClass(prefix + '-slide');
    $parent.addClass(prefix + '-parent');

    /* Recalculate the slide width after images are loaded */
    $slides.imagesLoaded().done(function() {
      slideWidth = $slides.first().outerWidth(true);
      $carousel.width(($slides.length + 1) * slideWidth);
      log('Images are loaded')
    });

    $parent
      .on('click', '.' + prefix + '-previous', function(e) {
        e.preventDefault();
        changeSlide(-1);
      })
      .on('click', '.' + prefix + '-next', function(e) {
        e.preventDefault();
        changeSlide(1);
      })
      .on('click', '.' + prefix + '-play', function(e) {
        e.preventDefault();
        play();
      })
      .on('click', '.' + prefix + '-stop', function(e) {
        e.preventDefault();
        stop();
      })
      .on('transitionend', function() {
        if (isTransitioning) {
          if (isPrevious) {
            $carousel.find('>:last').remove();
          } else {
            $carousel.find('>:first').remove();
          }

          isPrevious = false;
          isTransitioning = false;
        }
      });

    function changeSlide(count) {
      if (!isTransitioning) {
        isTransitioning = true;
        isPrevious = (count < 0) ? true : false;

        if (count < 0) {
          /* Go to previous slide */
          $carousel.find('>:last').clone(true).css('marginLeft', -slideWidth).prependTo($carousel);
          setTimeout(function() {
            $carousel.find('>:first').css('marginLeft', 0);
            log('Go to previous slide');
          }, 0);
        } else {
          /* Go to next slide */
          var $firstSlide = $carousel.find('>:first');
          $firstSlide.clone(true).appendTo($carousel);
          $firstSlide.css('marginLeft', -slideWidth);
          log('Go to next slide');
        }
      }
    }

    function play() {
      var interval = parseFloat($slides.first().css('transitionDuration')) * 1000 + config.interval;

      if (!isPlaying) {
        slideshow = setInterval(function() {
          changeSlide(1);
        }, interval);

        isPlaying = true;
        log('Slideshow started');
      }
    }

    function stop() {
      if (isPlaying) {
        clearInterval(slideshow);
        isPlaying = false;
        log('Slideshow stopped');
      }
    }

    function log(message) {
      if (config.debug) {
        console.log(message);
      }
    }

    if (config.slideshow) {
      play();
      log('Slideshow auto-started');
    }

    return this;
  };
}(jQuery));
