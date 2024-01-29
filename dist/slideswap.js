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
    const handleStart = function(e) {
      const carrier = e.type === "touchstart" ? e.touches[0] : e;
      startX = carrier.clientX;
      startY = carrier.clientY;
      startTime = Date.now();
    };
    const handleEnd = function(e) {
      const carrier = e.type === "touchmove" ? e.touches[0] : e;
      endX = carrier.clientX;
      endY = carrier.clientY;
      endTime = Date.now();
      handleSwipeGesture();
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
      if (direction.length && callback && timeElapsed <= timeThreshold) {
        callback({
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
        });
      }
    };
    element.addEventListener("touchstart", handleStart);
    element.addEventListener("touchmove", handleEnd);
    element.addEventListener("mousedown", handleStart);
    element.addEventListener("mouseup", handleEnd);
    return {
      destroy: function() {
        element.removeEventListener("touchstart", handleStart);
        element.removeEventListener("touchmove", handleEnd);
        element.removeEventListener("mousedown", handleStart);
        element.removeEventListener("mouseup", handleEnd);
      }
    };
  }

  // slideswap.js
  var Slideswap = class {
    constructor(element, options) {
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
        swipeClass: "slideswap-has-swipe"
      };
      if (typeof element === "string")
        this.element = document.querySelector(element);
      if (!this.element || !(this.element instanceof HTMLElement)) {
        throw new Error("slideswap: element property not provided, or element not found");
      }
      if (this.element.getAttribute("data-slideswap-initialized") === "true") {
        throw new Error("slideswap: element already initialized");
      }
      this.transitionDuration = getTransitionDurations(this.element);
      this.transitionTimer = null;
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
    }
    setupSwipe() {
      onSwipe(this.element, (e) => {
        if (!e.horizontal)
          return;
        if (e.horizontalDirection === "left") {
          this.next();
        } else {
          this.previous();
        }
      }, 50, 1e3);
      this.element.classList.add(this.options.swipeClass);
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
    }
    setCurrentSlide(index) {
      if (index < 0 || index >= this.slides.length)
        return;
      if (this.options.adaptiveHeight)
        this.element.style.height = `${this.slides[this.currentIndex].offsetHeight}px`;
      this.currentIndex = index;
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
        const image = this.getCurrentSlide().querySelector(this.options.imageSelector);
        if (image) {
          image.addEventListener("load", () => {
            if (!reset)
              this.element.style.height = `${currentSlide.offsetHeight}px`;
          });
        }
        if (this.transitionTimer) {
          clearTimeout(this.transitionTimer);
          this.transitionTimer = null;
        }
        const time = (/* @__PURE__ */ new Date()).getTime();
        this.transitionTimer = setTimeout(() => {
          currentSlide.style.position = "relative";
          this.element.style.height = "initial";
          reset = true;
          this.transitionTimer = null;
        }, this.transitionDuration["height"]);
      }
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
    getCurrentIndex() {
      return this.currentIndex;
    }
    getCurrentSlide() {
      return this.slides[this.currentIndex];
    }
    getNextIndex() {
      return this.options.infinite ? (this.currentIndex + 1) % this.slides.length : this.currentIndex + 1;
    }
    getPreviousIndex() {
      return this.options.infinite ? (this.currentIndex - 1 + this.slides.length) % this.slides.length : this.currentIndex - 1;
    }
    next() {
      this.setCurrentSlide(this.getNextIndex());
    }
    previous() {
      this.setCurrentSlide(this.getPreviousIndex());
    }
    destroy() {
      this.element = null;
      this.slides = null;
      this.options = null;
      this.currentIndex = null;
      this.maxHeight = null;
      if (this.options.next)
        this.options.next.removeEventListener("click", this.next.bind(this));
      if (this.options.prev)
        this.options.prev.removeEventListener("click", this.previous.bind(this));
    }
    addSlide(slide) {
      this.element.appendChild(slide);
      this.slides = this.element.querySelectorAll(`.${this.options.slideClass}`);
      this.setupSlides();
    }
    removeSlide(index) {
      this.element.removeChild(this.slides[index]);
      this.slides = this.element.querySelectorAll(`.${this.options.slideClass}`);
      if (this.currentIndex >= this.slides.length)
        this.setCurrentSlide(this.slides.length - 1);
      this.setupSlides();
    }
  };

  // build/iife.js
  if (!window.Slideswap) {
    window.Slideswap = Slideswap;
  }
})();
//# sourceMappingURL=slideswap.js.map
