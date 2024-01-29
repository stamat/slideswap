import { shallowMerge, getTransitionDurations, onSwipe } from 'book-of-spells'

/**
 * @name Slideswap
 * @description A simple slideshow plugin that cross fades between slides.
 * @param {HTMLElement} element - The element to initialize as a slideshow
 * @param {Object} options - The options for the slideshow
 * @param {Boolean} [options.infinite=false] - Whether or not the slideshow should loop infinitely
 * @param {String} [options.activeClass='slideswap-current-slide'] - The class to apply to the current slide
 * @todo bullet navigation
 * @todo autoplay
 * @todo events
 */
export default class Slideswap {
  constructor(element, options) {
    this.element = element
    this.currentIndex = 0
    this.slides = null
    this.maxHeight = 0
    this.options = {
      infinite: false,
      activeClass: 'slideswap-current-slide',
      slideSelector: '.js-slideswap',
      start: 0,
      adaptiveHeight: true,
      next: null,
      prev: null,
      imageSelector: '.js-slideswap-image',
      swipe: true,
      swipeClass: 'slideswap-has-swipe'
    }

    if (typeof element === 'string') this.element = document.querySelector(element)

    if (!this.element || !(this.element instanceof HTMLElement)) {
      throw new Error('slideswap: element property not provided, or element not found')
    }

    if (this.element.getAttribute('data-slideswap-initialized') === 'true') {
      throw new Error('slideswap: element already initialized')
    }

    this.transitionDuration = getTransitionDurations(this.element)
    this.transitionTimer = null

    shallowMerge(
      this.options,
      options
    )

    this.bindControls()

    this.slides = this.element.querySelectorAll(this.options.slideSelector)
    this.setCurrentSlide(this.options.start)
    this.element.setAttribute('data-slideswap-initialized', 'true')

    this.setupSlides()
    
    if (this.options.swipe) this.setupSwipe()
    
  }

  setupSwipe() {
    onSwipe(this.element, (e) => {
      if (!e.horizontal) return
      if (e.horizontalDirection === 'left') {
        this.next()
      } else {
        this.previous()
      }
    }, 50, 1000)

    this.element.classList.add(this.options.swipeClass)
  }

  bindControls() {
    if (!this.options.next && !this.options.prev) return
    this.options.next = typeof this.options.next === 'string' ? document.querySelector(this.options.next) : this.options.next
    this.options.prev = typeof this.options.prev === 'string' ? document.querySelector(this.options.prev) : this.options.prev

    if (this.options.next) this.options.next.addEventListener('click', this.next.bind(this))
    if (this.options.prev) this.options.prev.addEventListener('click', this.previous.bind(this))
  }

  setupSlides() {
    for (let i = 0; i < this.slides.length; i++) {
      const slide = this.slides[i]
      slide.setAttribute('data-slideswap-index', i)
      this.maxHeight = Math.max(this.maxHeight, slide.offsetHeight)

      slide.style.top = 0
      slide.style.left = 0
      slide.style.width = '100%'
      slide.style.height = 'auto'
      slide.style.overflow = 'hidden'

      if (i === this.currentIndex) {
        slide.style.position = 'relative'
      } else {
        slide.style.position = 'absolute'
        slide.style.opacity = 0
        slide.style.pointerEvents = 'none'
      }

      if (this.options.swipe) {
        const slideImages = slide.querySelectorAll(`img`)
        for (let i = 0; i < slideImages.length; i++) {
          const image = slideImages[i]
          image.draggable = false
          image.setAttribute('draggable', 'false')
        }
      }
    }

    if (!this.options.adaptiveHeight) {
      this.element.style.height = `${this.maxHeight}px`
    }
  }

  setCurrentSlide(index) {
    if (index < 0 || index >= this.slides.length) return
    
    if (this.options.adaptiveHeight) this.element.style.height = `${this.slides[this.currentIndex].offsetHeight}px`

    this.currentIndex = index
    const currentSlide = this.slides[index]
    currentSlide.classList.add(this.options.activeClass)
    currentSlide.removeAttribute('aria-hidden')
    currentSlide.setAttribute('tabindex', '0')
    currentSlide.style.zIndex = 1
    currentSlide.style.opacity = 1
    currentSlide.style.pointerEvents = 'auto'
    currentSlide.style.position = 'absolute'
    let reset = false

    if (this.options.adaptiveHeight) {
      this.element.style.height = `${currentSlide.offsetHeight}px`

      const image = this.getCurrentSlide().querySelector(this.options.imageSelector)
      if (image) {
        image.addEventListener('load', () => {
          if (!reset) this.element.style.height = `${currentSlide.offsetHeight}px`
        })
      }

      if (this.transitionTimer) {
        clearTimeout(this.transitionTimer)
        this.transitionTimer = null
      }
   
      const time  = new Date().getTime()
      this.transitionTimer = setTimeout(() => {
        currentSlide.style.position = 'relative'
        this.element.style.height = 'initial'
        reset = true
        this.transitionTimer = null
      }, this.transitionDuration['height'])
    }

    for (let i = 0; i < this.slides.length; i++) {
      const slide = this.slides[i]
      if (i === index) continue
      slide.classList.remove(this.options.activeClass)
      slide.setAttribute('aria-hidden', 'true')
      slide.setAttribute('tabindex', '-1')
      slide.style.zIndex = 0
      slide.style.opacity = 0
      slide.style.pointerEvents = 'none'
      slide.style.position = 'absolute'
    }
  }

  getCurrentIndex() {
    return this.currentIndex
  }

  getCurrentSlide() {
    return this.slides[this.currentIndex]
  }

  getNextIndex() {
    return this.options.infinite ? (this.currentIndex + 1) % this.slides.length : this.currentIndex + 1
  }

  getPreviousIndex() {
    return this.options.infinite ? (this.currentIndex - 1 + this.slides.length) % this.slides.length : this.currentIndex - 1
  }

  next() {
    this.setCurrentSlide(this.getNextIndex())
  }

  previous() {
    this.setCurrentSlide(this.getPreviousIndex())
  }

  destroy() {
    this.element = null
    this.slides = null
    this.options = null
    this.currentIndex = null
    this.maxHeight = null

    if (this.options.next) this.options.next.removeEventListener('click', this.next.bind(this))
    if (this.options.prev) this.options.prev.removeEventListener('click', this.previous.bind(this))
  }

  addSlide(slide) {
    this.element.appendChild(slide)
    this.slides = this.element.querySelectorAll(`.${this.options.slideClass}`)
    this.setupSlides()
  }

  removeSlide(index) {
    this.element.removeChild(this.slides[index])
    this.slides = this.element.querySelectorAll(`.${this.options.slideClass}`)
    if (this.currentIndex >= this.slides.length) this.setCurrentSlide(this.slides.length - 1)
    this.setupSlides()
  }
}
