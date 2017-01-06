class Carousel {
  constructor (selector, options = {}) {
    const carouselElement = document.querySelector(selector)

    // Merge provided options with defaults
    const mergedOptions = Object.assign({
      autoPlay: false,
      delay: 4000,
      duration: 400,
      infinite: false,
      rewind: false,
      showControls: true,
      showDots: true,
      onSlide: () => true
    }, options)

    // Assign class variables
    Object.assign(
      this,
      this.scaffold(carouselElement, mergedOptions),
      {
        options: mergedOptions,
        slideIndex: 0,
        xPosition: 0,
        touchStartX: null,
        touchMoveX: null,
        slideWidth: null,
        slideShowHandler: null,
        isSlideShowActive: false,
        isTransitioning: false
      }
    )

    // Show the first slide
    this.goTo(this.slideIndex, true)

    if (mergedOptions.autoPlay) {
      this.play()
    }

    // Reveal controls to the user
    return {
      goTo: this.goTo.bind(this),
      next: this.next.bind(this),
      previous: this.previous.bind(this),
      play: this.play.bind(this),
      pause: this.pause.bind(this)
    }
  }

  scaffold (carouselElement, options) {
    const {
      createDomElement
    } = this

    carouselElement.classList.add('carousel')

    // Slides array
    const slides = []
    while (carouselElement.firstElementChild) {
      const slide = createDomElement('div', 'carousel__slide')
      slide.appendChild(carouselElement.firstElementChild)
      slides.push(slide)
    }
    slides.map(slide => (slide.style.width = `calc(100% / ${slides.length})`))

    // Slides element
    const slidesElement = createDomElement('div', 'carousel__slides')
    slides.map(slide => slidesElement.appendChild(slide))
    slidesElement.style.width = `${slides.length * 100}%`
    slidesElement.addEventListener('touchstart', this.touchStart.bind(this))
    slidesElement.addEventListener('touchmove', this.touchMove.bind(this))
    slidesElement.addEventListener('touchend', this.touchEnd.bind(this))
    slidesElement.addEventListener('transitionend', this.transitionEnd.bind(this, options))
    this.enableSlideAnimation(slidesElement, options)

    // Clone the first/last slides if `infinite` option is enabled
    if (options.infinite) {
      const firstSlideClone = slides[0].cloneNode(true)
      firstSlideClone.classList.add('carousel__slide--clone')
      firstSlideClone.style.left = '100%'
      slidesElement.appendChild(firstSlideClone)

      const lastSlideClone = slides[slides.length - 1].cloneNode(true)
      lastSlideClone.classList.add('carousel__slide--clone')
      lastSlideClone.style.right = '100%'
      slidesElement.insertBefore(lastSlideClone, slides[0])
    }

    // Controls element
    const controlsElement = createDomElement('div', 'carousel__controls')
    const previousSlideControlElement = createDomElement('div', ['carousel__control', 'carousel__previous'])
    const nextSlideControlElement = createDomElement('div', ['carousel__control', 'carousel__next'])
    previousSlideControlElement.addEventListener('click', this.previous.bind(this))
    nextSlideControlElement.addEventListener('click', this.next.bind(this))
    controlsElement.appendChild(previousSlideControlElement)
    controlsElement.appendChild(nextSlideControlElement)

    // Dots element
    const dots = []
    const dotsElement = createDomElement('div', 'carousel__dots')
    slides.map((slide, i) => {
      const dot = createDomElement('div', 'carousel__dot')
      dot.addEventListener('click', this.goTo.bind(this, i, true))
      dotsElement.appendChild(dot)
      dots.push(dot)
    })

    // Combine elements
    carouselElement.appendChild(slidesElement)
    if (options.showControls) {
      carouselElement.appendChild(controlsElement)
    }
    if (options.showDots) {
      carouselElement.appendChild(dotsElement)
    }

    return {
      slidesElement,
      slides,
      dots
    }
  }

  goTo (index, force = false) {
    // Throttle slide transitions
    if (this.isTransitioning) {
      return false
    }
    this.isTransitioning = true

    this.measureSlide()

    const {
      slideIndex: fromIndex,
      slides,
      slideWidth,
      dots,
      options
    } = this
    const {
      infinite,
      rewind
    } = options
    const slidesCount = slides.length
    const toIndex = (slidesCount + index) % slidesCount

    const firstSlideIndex = 0
    const lastSlideIndex = slidesCount - 1

    const fromTheStart = (fromIndex === firstSlideIndex)
    const fromTheEnd = (fromIndex === lastSlideIndex)
    const toTheStart = (toIndex === firstSlideIndex)
    const toTheEnd = (toIndex === lastSlideIndex)

    let xPosition = toIndex * -slideWidth

    // Determine if and how to slide, based on options
    if (!force) {
      // Check the `onSlide` callback
      if (options.onSlide(toIndex, fromIndex) === false) {
        this.isTransitioning = false
        return false
      }

      if (infinite) {
        // Infinite
        if (fromTheStart && toTheEnd && index < 0) {
          xPosition = slideWidth
        } else if (fromTheEnd && toTheStart && index >= slidesCount) {
          xPosition = slidesCount * -slideWidth
        }
      } else {
        // Rewind
        if (!rewind && (
            (fromTheEnd && toTheStart) ||
            (fromTheStart && toTheEnd)
          )) {
          this.isTransitioning = false
          return false
        }
      }
    }

    this.moveX(xPosition)

    // If already at target `xPosition`, there is no transition
    if (toIndex * -slideWidth === xPosition) {
      this.isTransitioning = false
    }

    // Update the active dot
    if (options.showDots) {
      dots[fromIndex].classList.remove('carousel__dot--active')
      dots[toIndex].classList.add('carousel__dot--active')
    }

    // Reset the slide show delay
    if (this.isSlideShowActive) {
      this.pause()
      this.play()
    }

    this.xPosition = xPosition
    this.slideIndex = toIndex
  }

  // Controls
  previous () {
    this.goTo(this.slideIndex - 1)
  }

  next () {
    this.goTo(this.slideIndex + 1)
  }

  play () {
    this.isSlideShowActive = true
    this.slideShowHandler = setInterval(this.next.bind(this), this.options.delay)
  }

  pause () {
    clearInterval(this.slideShowHandler)
    this.isSlideShowActive = false
  }

  // Enable/disable slide animations
  enableSlideAnimation (element = this.slidesElement, options = this.options) {
    return Object.assign(element.style, {
      transitionProperty: 'transform',
      transitionDuration: `${options.duration / 1000}s`
    })
  }

  disableSlideAnimation (element = this.slidesElement) {
    this.isTransitioning = false
    return Object.assign(element.style, {
      transitionProperty: 'initial',
      transitionDuration: 'initial'
    })
  }

  // Position
  moveX (xPosition) {
    const {
      slides,
      slideWidth
    } = this

    this.slidesElement.style.transform = `translateX(calc(100% * ${xPosition} / ${slides.length * slideWidth}))`
  }

  // Event handlers
  touchStart (e) {
    if (this.isTransitioning) {
      return false
    }

    // Pause the slide show, but keep it active
    if (this.isSlideShowActive) {
      clearInterval(this.slideShowHandler)
    }

    this.touchStartX = e.touches[0].pageX
    this.measureSlide()
    this.disableSlideAnimation()
  }

  touchMove (e) {
    if (!this.touchStartX) {
      return false
    }

    this.touchMoveX = e.touches[0].pageX
    this.trackTouchMovement()

    // Stop page from scrolling if user is trying to slide
    if (Math.abs(this.touchStartX - this.touchMoveX) > 50) {
      e.preventDefault()
    }
  }

  touchEnd (e) {
    this.enableSlideAnimation()

    if (!this.touchMoveX) {
      return false
    }

    const {
      slideIndex,
      slideWidth,
      touchStartX,
      touchMoveX
    } = this
    const touchDeltaX = touchStartX - touchMoveX
    const threshold = slideWidth / 4

    if (Math.abs(touchDeltaX) > threshold) {
      if (touchDeltaX < 0) {
        // Snap to previous slide
        this.goTo(slideIndex - 1)
      } else {
        // Snap to next slide
        this.goTo(slideIndex + 1)
      }
    } else {
      // Snap back to current slide
      this.goTo(slideIndex)
    }

    this.touchStartX = null
    this.touchMoveX = null
  }

  trackTouchMovement () {
    const {
      touchStartX,
      touchMoveX,
      xPosition,
      slideWidth,
      slides,
      options
    } = this

    if (!touchMoveX) {
      return false
    }

    const {
      requestAnimationFrame
    } = window

    let touchDeltaX = Math.max(Math.min((touchStartX - touchMoveX), slideWidth), -slideWidth)
    let touchX = xPosition - touchDeltaX

    // Restrict touch movement to visible slides
    if (!options.infinite) {
      touchX = Math.max(Math.min(touchX, 0), (slides.length - 1) * -slideWidth)
    }

    this.moveX(touchX)

    requestAnimationFrame(this.trackTouchMovement.bind(this))
  }

  transitionEnd (options, e) {
    if (e.propertyName !== 'transform') {
      return false
    }

    if (options.infinite) {
      const {
        slideIndex,
        slideWidth
      } = this
      const xPosition = slideIndex * -slideWidth

      // Instantly reposition the `slidesElement`
      this.disableSlideAnimation()
      this.moveX(xPosition)
      setTimeout(() => this.enableSlideAnimation(), 1)

      this.xPosition = xPosition
    }

    this.isTransitioning = false
  }

  // Helpers
  createDomElement (tag, classNames) {
    const element = document.createElement(tag)
    element.classList.add.apply(element.classList, Array.isArray(classNames) ? classNames : [classNames])

    return element
  }

  measureSlide () {
    this.slideWidth = this.slides[0].getBoundingClientRect().width
  }
}

export default Carousel
