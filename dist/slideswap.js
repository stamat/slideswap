/* slideswap v1.0.0 | https://stamat.github.io/slideswap/ | MIT License */
(() => {
  // node_modules/book-of-spells/src/helpers.mjs
  function shallowMerge(target, source) {
    for (const key in source) {
      target[key] = source[key];
    }
    return target;
  }

  // node_modules/book-of-spells/src/dom.mjs
  function insertBeforeElement(targetElement, newElement) {
    if (!targetElement || !newElement)
      return;
    targetElement.parentNode.insertBefore(newElement, targetElement);
  }
  function cssTimeToMilliseconds(duration) {
    const regExp = new RegExp("([0-9.]+)([a-z]+)", "i");
    const matches = regExp.exec(duration);
    if (!matches)
      return 0;
    const unit = matches[2];
    switch (unit) {
      case "ms":
        return parseFloat(matches[1]);
      case "s":
        return parseFloat(matches[1]) * 1e3;
      default:
        return 0;
    }
  }
  function getTransitionDurations(element) {
    if (!element) {
    }
    const styles = getComputedStyle(element);
    const transitionProperties = styles.getPropertyValue("transition-property").split(",");
    const transitionDurations = styles.getPropertyValue("transition-duration").split(",");
    const map = {};
    for (let i = 0; i < transitionProperties.length; i++) {
      const property = transitionProperties[i].trim();
      map[property] = transitionDurations.hasOwnProperty(i) ? cssTimeToMilliseconds(transitionDurations[i].trim()) : null;
    }
    return map;
  }
  function onSwipe(element, callback, threshold = 150, timeThreshold = 0) {
    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;
    let startTime = 0;
    let endTime = 0;
    if (!element)
      return;
    if (element.getAttribute("swipe-enabled") === "true")
      return;
    element.setAttribute("swipe-enabled", "true");
    const handleStart = function(e) {
      const carrier = e.touches ? e.touches[0] : e;
      startX = carrier.clientX;
      startY = carrier.clientY;
      startTime = Date.now();
      element.dispatchEvent(new CustomEvent("swipestart", { detail: { startX, startY, startTime } }));
    };
    const handleEnd = function(e) {
      const carrier = e.changedTouches ? e.changedTouches[0] : e;
      endX = carrier.clientX;
      endY = carrier.clientY;
      endTime = Date.now();
      handleSwipeGesture();
      element.dispatchEvent(new CustomEvent("swipeend", { detail: { startX, startY, startTime, endX, endY, endTime } }));
    };
    const handleSwipeGesture = function() {
      const deltaX = Math.abs(endX - startX);
      const deltaY = Math.abs(endY - startY);
      const horizontal = deltaX > threshold;
      const vertical = deltaY > threshold;
      const left = endX < startX;
      const up = endY < startY;
      const direction = [];
      const timeElapsed = endTime - startTime;
      if (horizontal)
        direction.push(left ? "left" : "right");
      if (vertical)
        direction.push(up ? "up" : "down");
      let condition = direction.length && callback;
      if (timeThreshold)
        condition = condition && timeElapsed <= timeThreshold;
      if (condition) {
        const res = {
          target: element,
          deltaX,
          deltaY,
          startX,
          startY,
          endX,
          endY,
          threshold,
          horizontal,
          vertical,
          horizontalDirection: left ? "left" : "right",
          verticalDirection: up ? "up" : "down",
          direction: direction.length === 1 ? direction[0] : direction,
          timeElapsed,
          timeThreshold
        };
        callback(res);
        delete res.target;
        element.dispatchEvent(new CustomEvent("swipe", { detail: res }));
      }
    };
    element.addEventListener("touchstart", handleStart);
    element.addEventListener("touchend", handleEnd);
    element.addEventListener("mousedown", handleStart);
    element.addEventListener("mouseup", handleEnd);
    return {
      destroy: function() {
        element.removeEventListener("touchstart", handleStart);
        element.removeEventListener("touchend", handleEnd);
        element.removeEventListener("mousedown", handleStart);
        element.removeEventListener("mouseup", handleEnd);
      }
    };
  }

  // slideswap.js
  var Slideswap = class {
    constructor(element, options) {
      this.init(element, options);
    }
    init(element, options) {
      this.element = element;
      this.currentIndex = 0;
      this.slides = null;
      this.maxHeight = 0;
      this.options = {
        infinite: false,
        activeClass: "slideswap-current-slide",
        slideSelector: ".js-slideswap",
        start: 0,
        adaptiveHeight: true,
        next: null,
        prev: null,
        imageSelector: ".js-slideswap-image",
        swipe: true,
        swipeClass: "slideswap-has-swipe",
        swipeActiveClass: "slideswap-swipe-active",
        swipeThreshold: 100,
        swipeTimeThreshold: 1e3
      };
      if (typeof element === "string")
        this.element = document.querySelector(element);
      if (!this.element || !(this.element instanceof HTMLElement)) {
        throw new Error("slideswap: element property not provided, or element not found");
      }
      if (this.element.getAttribute("data-slideswap-initialized") === "true") {
        throw new Error("slideswap: element already initialized");
      }
      this.transitionHeightDuration = getTransitionDurations(this.element)["height"] || 0;
      this.transitionHeightTimer = null;
      this.transitionSlideDuration = 0;
      this.transitionSlideTimer = null;
      shallowMerge(
        this.options,
        options
      );
      this.bindControls();
      this.slides = this.element.querySelectorAll(this.options.slideSelector);
      this.setCurrentSlide(this.options.start);
      this.element.setAttribute("data-slideswap-initialized", "true");
      this.setupSlides();
      if (this.options.swipe)
        this.setupSwipe();
      this.dispatchEvent("init");
    }
    setupSwipe() {
      this.swipe = onSwipe(this.element, (e) => {
        if (!e.horizontal)
          return;
        e.horizontalDirection === "left" ? this.next() : this.previous();
      }, this.options.swipeThreshold, this.options.swipeTimeThreshold);
      this.element.addEventListener("swipestart", this.onSwipeStart.bind(this));
      this.element.addEventListener("swipeend", this.onSwipeEnd.bind(this));
      this.element.classList.add(this.options.swipeClass);
    }
    onSwipeStart() {
      this.element.classList.add(this.options.swipeActiveClass);
    }
    onSwipeEnd() {
      this.element.classList.remove(this.options.swipeActiveClass);
    }
    bindControls() {
      if (!this.options.next && !this.options.prev)
        return;
      this.options.next = typeof this.options.next === "string" ? document.querySelector(this.options.next) : this.options.next;
      this.options.prev = typeof this.options.prev === "string" ? document.querySelector(this.options.prev) : this.options.prev;
      if (this.options.next)
        this.options.next.addEventListener("click", this.next.bind(this));
      if (this.options.prev)
        this.options.prev.addEventListener("click", this.previous.bind(this));
    }
    setupSlides() {
      if (!this.slides || !this.slides.length)
        return;
      for (let i = 0; i < this.slides.length; i++) {
        const slide = this.slides[i];
        slide.setAttribute("data-slideswap-index", i);
        this.maxHeight = Math.max(this.maxHeight, slide.offsetHeight);
        slide.style.top = 0;
        slide.style.left = 0;
        slide.style.width = "100%";
        slide.style.height = "auto";
        slide.style.overflow = "hidden";
        if (i === this.currentIndex) {
          slide.style.position = "relative";
        } else {
          slide.style.position = "absolute";
          slide.style.opacity = 0;
          slide.style.pointerEvents = "none";
        }
        if (this.options.swipe) {
          const slideImages = slide.querySelectorAll(`img`);
          for (let i2 = 0; i2 < slideImages.length; i2++) {
            const image = slideImages[i2];
            image.draggable = false;
            image.setAttribute("draggable", "false");
          }
        }
      }
      if (!this.options.adaptiveHeight) {
        this.element.style.height = `${this.maxHeight}px`;
      }
      this.transitionSlideDuration = getTransitionDurations(this.getCurrentSlide())["opacity"] || 0;
    }
    setCurrentSlide(index) {
      if (!this.slides || !this.slides.length)
        return;
      if (this.transitionHeightTimer) {
        clearTimeout(this.transitionHeightTimer);
        this.transitionHeightTimer = null;
      }
      if (this.transitionSlideTimer) {
        clearTimeout(this.transitionSlideTimer);
        this.transitionSlideTimer = null;
      }
      if (index === void 0 || index === null)
        return;
      if (index < 0 || index >= this.slides.length)
        return;
      if (this.options.adaptiveHeight)
        this.element.style.height = `${this.slides[this.currentIndex].offsetHeight}px`;
      const previousIndex = this.currentIndex;
      if (index !== previousIndex)
        this.dispatchEvent("beforechange", { index, previousIndex });
      this.currentIndex = index;
      this.element.setAttribute("data-slideswap-current-index", this.currentIndex);
      const currentSlide = this.slides[index];
      currentSlide.classList.add(this.options.activeClass);
      currentSlide.removeAttribute("aria-hidden");
      currentSlide.setAttribute("tabindex", "0");
      currentSlide.style.zIndex = 1;
      currentSlide.style.opacity = 1;
      currentSlide.style.pointerEvents = "auto";
      currentSlide.style.position = "absolute";
      let reset = false;
      if (this.options.adaptiveHeight) {
        this.element.style.height = `${currentSlide.offsetHeight}px`;
        let image = currentSlide.querySelector(this.options.imageSelector);
        if (!image)
          image = currentSlide.querySelector("img");
        if (image) {
          image.addEventListener("load", () => {
            if (!reset)
              this.element.style.height = `${currentSlide.offsetHeight}px`;
          });
        }
        this.transitionHeightTimer = setTimeout(() => {
          currentSlide.style.position = "relative";
          this.element.style.height = "initial";
          reset = true;
          this.transitionHeightTimer = null;
        }, this.transitionHeightDuration);
      }
      this.transitionSlideTimer = setTimeout(() => {
        this.transitionSlideTimer = null;
        if (index !== previousIndex)
          this.dispatchEvent("change", { index, previousIndex });
      }, this.transitionSlideDuration);
      for (let i = 0; i < this.slides.length; i++) {
        const slide = this.slides[i];
        if (i === index)
          continue;
        slide.classList.remove(this.options.activeClass);
        slide.setAttribute("aria-hidden", "true");
        slide.setAttribute("tabindex", "-1");
        slide.style.zIndex = 0;
        slide.style.opacity = 0;
        slide.style.pointerEvents = "none";
        slide.style.position = "absolute";
      }
    }
    dispatchEvent(type, options = {}) {
      if (!this.slides || !this.slides.length)
        return;
      const event = new CustomEvent(`slideswap:${type}`, {
        detail: {
          ...options,
          slideswap: this
        }
      });
      this.element.dispatchEvent(event);
      document.dispatchEvent(event);
    }
    getCurrentIndex() {
      if (!this.slides || !this.slides.length)
        return;
      return this.currentIndex;
    }
    getCurrentSlide() {
      if (!this.slides || !this.slides.length)
        return;
      return this.slides[this.currentIndex];
    }
    getNextIndex() {
      if (!this.slides || !this.slides.length)
        return;
      const nextIndex = this.currentIndex + 1;
      if (this.options.infinite && nextIndex >= this.slides.length)
        return 0;
      if (nextIndex >= this.slides.length)
        return this.currentIndex;
      return nextIndex;
    }
    getPreviousIndex() {
      if (!this.slides || !this.slides.length)
        return;
      const previousIndex = this.currentIndex - 1;
      if (this.options.infinite && previousIndex < 0)
        return this.slides.length - 1;
      if (previousIndex < 0)
        return this.currentIndex;
      return previousIndex;
    }
    next() {
      this.setCurrentSlide(this.getNextIndex());
    }
    previous() {
      this.setCurrentSlide(this.getPreviousIndex());
    }
    destroy() {
      this.dispatchEvent("destroy", { element: this.element, slides: this.slides, options: this.options, currentIndex: this.currentIndex, maxHeight: this.maxHeight });
      this.element = null;
      this.slides = null;
      this.options = null;
      this.currentIndex = null;
      this.maxHeight = null;
      if (this.options.next)
        this.options.next.removeEventListener("click", this.next.bind(this));
      if (this.options.prev)
        this.options.prev.removeEventListener("click", this.previous.bind(this));
      if (this.options.swipe)
        this.swipe.destroy();
      this.swipe = null;
      this.element.removeEventListener("swipestart", this.onSwipeStart.bind(this));
      this.element.removeEventListener("swipeend", this.onSwipeEnd.bind(this));
    }
    add(slide, index) {
      if (!slide || !(slide instanceof HTMLElement))
        return;
      if (!this.slides)
        this.slides = [];
      if (index === void 0 || index === null)
        index = this.slides.length;
      if (index < 0)
        return;
      slide.style.opacity = 0;
      if (index > this.slides.length) {
        this.element.appendChild(slide);
      } else {
        if (this.slides[index])
          insertBeforeElement(this.slides[index], slide);
        else
          this.element.appendChild(slide);
      }
      this.slides = this.element.querySelectorAll(this.options.slideSelector);
      if (index <= this.currentIndex) {
        const nextIndex = this.currentIndex + 1;
        this.currentIndex = nextIndex >= this.slides.length ? this.slides.length - 1 : nextIndex;
      }
      this.setupSlides();
      this.setCurrentSlide(this.currentIndex);
    }
    remove(index) {
      if (!this.slides || !this.slides.length)
        return;
      this.element.removeChild(this.slides[index]);
      this.slides = this.element.querySelectorAll(this.options.slideSelector);
      if (index <= this.currentIndex) {
        const previousIndex = this.currentIndex - 1;
        this.currentIndex = previousIndex < 0 ? 0 : previousIndex;
      }
      this.setupSlides();
      this.setCurrentSlide(this.currentIndex);
    }
  };

  // build/iife.js
  if (!window.Slideswap) {
    window.Slideswap = Slideswap;
  }
})();
//# sourceMappingURL=slideswap.js.map
