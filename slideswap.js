import { shallowMerge, getTransitionDurations, onSwipe, insertBeforeElement } from 'book-of-spells'

/**
 * @name Slideswap
 * @description A simple slideshow that cross fades between slides.
 * @param {HTMLElement} element - The element to initialize as a slideshow
 * @param {Object} options - The options for the slideshow
 * @param {Boolean} [options.infinite=false] - Whether or not the slideshow should loop infinitely
 * @param {String} [options.activeClass='slideswap-current-slide'] - The class to apply to the current slide
 * @param {String} [options.slideSelector='.js-slideswap'] - The selector for the slides
 * @param {Number} [options.start=0] - The index of the slide to start on
 * @param {Boolean} [options.adaptiveHeight=true] - Whether or not the slideshow should adapt to the height of the current slide
 * @param {HTMLElement|String} [options.next=null] - The element to use as the next button or selector for the next button
 * @param {HTMLElement|String} [options.prev=null] - The element to use as the previous button or selector for the previous button
 * @param {String} [options.imageSelector='.js-slideswap-image'] - The selector for the images in the slides
 * @param {Boolean} [options.swipe=true] - Whether or not the slideshow should be swipeable
 * @param {String} [options.swipeClass='slideswap-has-swipe'] - The class to apply to the slideshow when it is swipeable
 * @param {String} [options.swipeActiveClass='slideswap-swipe-active'] - The class to apply to the slideshow when it is being swiped
 * @param {Number} [options.swipeThreshold=100] - The minimum distance the swipe must travel to trigger a slide change
 * @param {Number} [options.swipeTimeThreshold=1000] - The maximum amount of time the swipe can take to trigger a slide change in milliseconds. 0 disables this.
 * @returns {Slideswap} The initialized slideshow
 * @example
 * const slideshows = document.querySelectorAll('.js-slideshow')
 * for (let i = 0; i < slideshows.length; i++) {
 *  const slideshow = new Slideswap(slideshows[i], {
 *    infinite: true,
 *  })
 * 
 *  // slideshow.next()
 *  // slideshow.previous()
 *  // slideshow.getCurrentIndex()
 *  // slideshow.getCurrentSlide()
 *  // slideshow.addSlide(slide)
 *  // slideshow.removeSlide(index)
 *  // slideshow.destroy()
 * }
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
      swipeClass: 'slideswap-has-swipe',
      swipeActiveClass: 'slideswap-swipe-active',
      swipeThreshold: 100,
      swipeTimeThreshold: 1000
    }

    if (typeof element === 'string') this.element = document.querySelector(element)

    if (!this.element || !(this.element instanceof HTMLElement)) {
      throw new Error('slideswap: element property not provided, or element not found')
    }

    if (this.element.getAttribute('data-slideswap-initialized') === 'true') {
      throw new Error('slideswap: element already initialized')
    }

    this.transitionHeightDuration = getTransitionDurations(this.element)
    this.transitionHeightTimer = null

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
      e.horizontalDirection === 'left' ? this.next() : this.previous()
    }, this.options.swipeThreshold, this.options.swipeTimeThreshold)

    this.element.addEventListener('swipestart', () => {
      this.element.classList.add(this.options.swipeActiveClass)
    })

    this.element.addEventListener('swipeend', () => {
      this.element.classList.remove(this.options.swipeActiveClass)
    })

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
    if (!this.slides || !this.slides.length) return
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
    if (!this.slides || !this.slides.length) return
    if (this.transitionHeightTimer) {
      clearTimeout(this.transitionHeightTimer)
      this.transitionHeightTimer = null
    }
    if (index === undefined || index === null) return
    if (index < 0 || index >= this.slides.length) return
    
    if (this.options.adaptiveHeight) this.element.style.height = `${this.slides[this.currentIndex].offsetHeight}px`

    this.currentIndex = index
    this.element.setAttribute('data-slideswap-current-index', this.currentIndex)
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
   
      this.transitionHeightTimer = setTimeout(() => {
        currentSlide.style.position = 'relative'
        this.element.style.height = 'initial'
        reset = true
        this.transitionHeightTimer = null
      }, this.transitionHeightDuration['height'])
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
    if (!this.slides || !this.slides.length) return
    return this.currentIndex
  }

  getCurrentSlide() {
    if (!this.slides || !this.slides.length) return
    return this.slides[this.currentIndex]
  }

  getNextIndex() {
    if (!this.slides || !this.slides.length) return
    const nextIndex = this.currentIndex + 1
    if (this.options.infinite && nextIndex >= this.slides.length) return 0
    if (nextIndex >= this.slides.length) return this.currentIndex
    return nextIndex
  }

  getPreviousIndex() {
    if (!this.slides || !this.slides.length) return
    const previousIndex = this.currentIndex - 1
    if (this.options.infinite && previousIndex < 0) return this.slides.length - 1
    if (previousIndex < 0) return this.currentIndex
    return previousIndex
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

  add(slide, index) {
    if (!slide || !(slide instanceof HTMLElement)) return
    if (!this.slides) this.slides = []
    if (index === undefined || index === null) index = this.slides.length
    if (index < 0) return

    slide.style.opacity = 0

    if (index > this.slides.length) {
      this.element.appendChild(slide)
    } else {
      if (this.slides[index])
        insertBeforeElement(this.slides[index], slide)
      else
        this.element.appendChild(slide)
    }

    this.slides = this.element.querySelectorAll(this.options.slideSelector)

    if (index <= this.currentIndex) {
      const nextIndex = this.currentIndex + 1
      this.currentIndex = nextIndex >= this.slides.length ? this.slides.length - 1 : nextIndex
    }

    this.setupSlides()
    this.setCurrentSlide(this.currentIndex)
  }

  remove(index) {
    if (!this.slides || !this.slides.length) return
    this.element.removeChild(this.slides[index])
    this.slides = this.element.querySelectorAll(this.options.slideSelector)

    if (index <= this.currentIndex) {
      const previousIndex = this.currentIndex - 1
      this.currentIndex = previousIndex < 0 ? 0 : previousIndex
    }

    this.setupSlides()
    this.setCurrentSlide(this.currentIndex)
  }
}
