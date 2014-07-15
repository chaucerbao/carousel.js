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
      slideWidth = $parent.width(),
      isTransitioning = false,
      isPrevious = false,
      isPlaying = false,
      slideshow;

    $slides.addClass(prefix + '-slide');
    $parent.addClass(prefix + '-parent');

    /* Set widths */
    $carousel.css('width',(($slides.length+1)*100)+'%');
    $slides.css('width',(100/($slides.length+1))+'%');
    $(window).resize(function() {
      slideWidth = $parent.width();
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
          count = -1;
        } else {
          /* Go to next slide */
          var $firstSlide = $carousel.find('>:first');
          $firstSlide.clone(true).appendTo($carousel);
          $firstSlide.css('marginLeft', -slideWidth);
          log('Go to next slide');
          count = 1;
        }
        $parent.trigger({
          type: "carousel.change",
          total: $slides.length,
          count: count
        });
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

    $parent.trigger({
      type: "carousel.change",
      total: $slides.length,
      count: 0
    });

    return this;
  };
}(jQuery));
