# slideswap

[![npm version](https://img.shields.io/npm/v/slideswap)](https://www.npmjs.com/package/slideswap)
[![license mit](https://img.shields.io/badge/license-MIT-green)](https://github.com/stamat/slideswap/blob/main/LICENSE)


Minimal and performant fade slideshow written in pure JavaScript that leans as much as possible on CSS animations. Responsiveness is native, no resize listener. Uses your elements, doesn't detach them or clone them. Provided as ESM and IIFE.

### Features

- No dependencies
- Small footprint
- CSS animations, transition duration is set in CSS
- ESM and IIFE
- Adaptive height (also animated)
- Responsive (no resize listener)
- Uses your elements, doesn't detach them or clone them
- Supports touch events (swipe) and mouse events (swipe simulation)
- Supports infinite loop
- Custom next and prev buttons
- No CLS (Cumulative Layout Shift) if you set initial classes and start from the first slide

### Demo

[https://stamat.github.io/slideswap/](https://stamat.github.io/slideswap/)

## Installation

### NPM
```bash
npm install slideswap
```

### Yarn
```bash
yarn add slideswap
```

Include the module in your project

```javascript
import Slideswap from 'slideswap'; // If you have node_modules resolution, if not than add the path to the module
```

Include the SCSS file in your project or copy the styles from it, it's a very small CSS inside

```scss
@import 'slideswap'; // If you have node_modules resolution, if not than add the path to the SCSS file
```

### CDN

```html
<script src="https://unpkg.com/slideswap/dist/slideswap.min.js"></script>
<link rel="stylesheet" href="https://unpkg.com/slideswap/dist/slideswap.min.css">
```

## Usage

### Basic usage
```html
<div id="slider-controls-1" class="slideswap-controls">
  <button class="js-slideswap-prev">Prev</button>
  <button class="js-slideswap-next">Next</button>
</div>
<div id="slider-1" class="slideswap-slides">
  <div class="slideswap-slide">Slide 1</div>
  <div class="slideswap-slide">Slide 2</div>
  <div class="slideswap-slide">Slide 3</div>
</div>

<script type="text/javascript">
  const slider = new Slideswap('#slider-1', {
    next: '#slider-controls-1 .js-slideswap-next',
    prev: '#slider-controls-1 .js-slideswap-prev',
    infinite: true
  });

  slider.element.addEventListener('slideswap:beforechange', (e) => {
    console.log(e.detail);
  });

  document.addEventListener('slideswap:beforechange', (e) => {
    console.log(e.detail);
  });

  slider.element.addEventListener('slideswap:change', (e) => {
    console.log(e.detail);
  });

  document.addEventListener('slideswap:change', (e) => {
    console.log(e.detail);
  });

  // slider.next(); - to go to the next slide
  // slider.previous(); - to go to the previous slide
  // slider.setCurrentSlide(index); - to go to a specific slide
  // slider.getCurrentSlide(); - to get the current slide index
  // slider.getNextIndex(); - to get the next slide index
  // slider.getPreviousIndex(); - to get the previous slide index
  // slider.getCurrentIndex(); - to get the current slide index
  // slider.getSlidesCount(); - to get the total number of slides
  // slider.destroy(); - to destroy the instance
  // slider.init(element, options); - to reinit the instance (if you have destroyed it)
</script>
```

The constructor accepts two arguments, the first one is the **element or selector for the element** and the second one is the **options object**.

```javascript
new Slideswap(element, options);
```

### Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| infinite | Boolean | false | Whether or not the slideshow should loop infinitely |
| activeClass | String | slideswap-current-slide | The class to apply to the current slide |
| slideSelector | String | `:scope > *` | The selector for the slides |
| start | Number | 0 | The index of the slide to start on |
| adaptiveHeight | Boolean | true | Whether or not the slideshow should adapt to the height of the current slide |
| next | HTMLElement or String | null | The element to use as the next button or selector for the next button |
| prev | HTMLElement or String | null | The element to use as the previous button or selector for the previous button |
| imageSelector | String | `:scope > img` | The selector for the images in the slides |
| swipe | Boolean | true | Whether or not the slideshow should be swipeable |
| swipeClass | String | slideswap-has-swipe | The class to apply to the slideshow when it is swipeable |
| swipeActiveClass | String | slideswap-swipe-active | The class to apply to the slideshow when it is being swiped |
| swipeThreshold | Number | 100 | The minimum distance the swipe must travel to trigger a slide change |
| swipeTimeThreshold | Number | 1000 | The maximum amount of time the swipe can take to trigger a slide change in milliseconds. 0 disables this. |

### Events

Events are triggered for each instance element and for the document. The event detail contains the object the target slide index and the previous slide index.

| Event | Description |
| --- | --- |
| slideswap:init | Fires after the instance is initialized. |
| slideswap:beforechange | Fires before the slide changes. The event detail contains the current slide index and the next slide index. |
| slideswap:change | Fires after the slide changes. The event detail contains the current slide index and the previous slide index. |
| slideswap:destroy | Fires after the instance is destroyed. |

### Methods

| Method | Description |
| --- | --- |
| next() | Goes to the next slide. |
| previous() | Goes to the previous slide. |
| setCurrentSlide(index) | Goes to a specific slide. |
| getCurrentSlide() | Returns the current slide index. |
| getNextIndex() | Returns the next slide index. |
| getPreviousIndex() | Returns the previous slide index. |
| getCurrentIndex() | Returns the current slide index. |
| getSlidesCount() | Returns the total number of slides. |
| add(slide, index) | Adds a slide. Slide parameter is an HTMLElement and index is insert before index and is optional |
| remove(index) | Removes a slide. If index is not provided or invalid it will remove the last slide |
| destroy() | Destroys the instance. |
| init(element, options) | Reinitializes the instance. |

### Public properties

| Property | Description |
| --- | --- |
| element | The instance element. |
| options | The instance options. |
| slides | The instance slides. |
| currentIndex | The current slide index. |

## TODO

- [ ] Add autoplay
- [ ] Add bullet navigation
- [ ] Add keyboard navigation
- [ ] Fix animation on current slide remove
- [ ] Wheel event support?
