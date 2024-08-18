# LazyLoader

`LazyLoader` is a JavaScript utility class designed to improve the performance of your web pages by deferring the loading of images until they are about to enter the viewport. This helps to reduce initial page load times and save bandwidth for users.

## Features

- **IntersectionObserver API**: Uses the IntersectionObserver API to efficiently load images as they enter the viewport.
- **Fallback Support**: Automatically falls back to loading all images if the IntersectionObserver API is not supported.
- **Error Handling & Retry Mechanism**: Retries loading images a configurable number of times if they fail to load initially.
- **Customizable**: Easily configurable via options for loading class, loaded class, error class, root margin, and more.
- **Callback Support**: Allows you to specify a callback function to be executed after an image is successfully loaded.

## Installation

You can include the `LazyLoader` class in your project by importing it:

```javascript
import LazyLoader from "./LazyLoader";
```

## Usage

### Basic Usage

##### Add the data-src or data-srcset attributes to your images:

```html
<img class="lazy-load" data-src="image.jpg" alt="Lazy Loaded Image" />
```

#### Initialize the LazyLoader:

```js
const lazyLoader = new LazyLoader();
```

### Configuration Options

##### The LazyLoader constructor accepts an options object for customization:

```js
const options = {
  loadingClass: "loading", // CSS class applied while the image is loading
  loadedClass: "loaded", // CSS class applied when the image is fully loaded
  selector: ".lazy-load", // CSS selector to target lazy load elements
  errorClass: "failed", // CSS class applied when an image fails to load
  retryAfter: 2000, // Time (in ms) to wait before retrying a failed load
  maxRetries: 4, // Maximum number of retries for failed loads
  loadCallback: null, // Callback function to execute after an image is loaded
  failCallback: null, // Callback function to execute after an image failed to load

  rootMargin: "0px 0px 100px 0px", // Root margin for IntersectionObserver
  threshold: 0.1, // Threshold for IntersectionObserver
};

const lazyLoader = new LazyLoader(options);
```

### Example

###### Here’s how you can use LazyLoader in a typical scenario:

```js
window.addEventListener("DOMContentLoaded", async () => {
  await Render(".products");
  const lazyloader = new LazyLoader({
    loadCallback: (img) => console.log(img.src),
    failCallback: (img) => (img.src = "https://placehold.co/600x400"),
  });
});
```

### Methods

#### 'destroy()'

##### Disconnects the observer and clears all tracked elements. Use this if you need to clean up the instance.

```js
lazyLoader.destroy();
```

## Browser Support

LazyLoader is supported in all modern browsers that support the IntersectionObserver API. For older browsers, the class provides a fallback mechanism that loads all images immediately.

## License

### This project is licensed under the MIT License
