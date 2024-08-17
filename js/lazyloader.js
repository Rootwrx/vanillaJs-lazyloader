class LazyLoader {
  constructor(options = {}) {
    this.options = {
      loadingClass: "loading",
      loadedClass: "loaded",
      selector: ".lazy-load",
      errorClass: "error",
      retryAfter: 500,
      maxRetries: 3,
      loadCallback: null,
      rootMargin: "0px 0px 100px 0px",
      threshold: 0.1,
      ...options,
    };
    // prettier-ignore
    this.selector = `${this.options.selector.trim()}:not([data-status="${this.options.loadedClass}"],[data-status="${this.options.loadingClass}"])`;

    this.elements = new Map();
    this.observer = null;
    this.lazyImgs = [];
    this.init();
  }

  handleIntersection(entries) {
    entries.forEach(
      (entry) => entry.isIntersecting && this.loadElement(entry.target)
    );
  }
  init() {
    this.lazyImgs =
      Array.from(document.querySelectorAll(this.selector)) || elements;
    if ("IntersectionObserver" in window) {
      this.observer = new IntersectionObserver(
        this.handleIntersection.bind(this),
        {
          rootMargin: this.options.rootMargin,
          threshold: this.options.threshold,
        }
      );
      this.observe();
    } else {
      console.warn("IntersectionObserver is not supported by this browser.");
      this.loadImagesFallback();
    }
  }

  observe() {
    if (this.lazyImgs.length == 0) return;

    this.lazyImgs.forEach((element) => {
      if (!this.elements.has(element)) {
        this.elements.set(element, {
          src: element.dataset?.src,
          srcset: element.dataset?.srcset,
        });
        this.observer.observe(element);
      }
    });
  }
  loadImagesFallback() {
    this.lazyImgs.forEach((image) => {
      if (image) this.loadElement(image);
    });
  }

  async loadElement(element) {
    if (
      element.dataset.status == this.options.loadingClass ||
      element.dataset.status == this.options.loadedClass
    )
      return;
    const data = this.elements.get(element);
    if (!data) return;

    element.dataset.status = this.options.loadingClass;
    element.classList.add(this.options.loadingClass);

    try {
      if (element.tagName.toLowerCase() === "img")
        await this.loadImg(element, data);
      else await this.loadBgImg(element, data);

      element.classList.replace(
        this.options.loadingClass,
        this.options.loadedClass
      );
      element.removeAttribute("data-src");
      element.removeAttribute("data-srcset");

      element.dataset.status = this.options.loadedClass;

      if (typeof this.options.loadCallback === "function")
        this.options.loadCallback();
      this.unobserve(element);
    } catch (error) {
      this.handleError(element, data, error);
    }
  }
  handleError(element, data, error) {
    if (!data.retries) data.retries = 0;
    console.error(error.message);

    element.dataset.status = "failed";
    if (data.retries < this.options.maxRetries) {
      data.retries += 1;
      setTimeout(() => this.refresh(element), this.options.retryAfter);
    } else this.markAsError(element);
  }

  markAsError(element) {
    element.classList.replace(
      this.options.loadingClass,
      this.options.errorClass
    );
    this.unobserve(element);
  }

  refresh(element) {
    console.log(`Retrying loading for: ${element.dataset.src}`);
    this.observer.unobserve(element);
    this.observer.observe(element);
  }
  unobserve(element) {
    this.observer.unobserve(element);
    this.elements.delete(element);
  }

  loadImg(img, data) {
    return new Promise((resolve, reject) => {
      img.src = data.src;
      img.srcset = data.srcset;

      img.onload = resolve;
      img.onerror = () =>
        reject(new Error(`Failed to load image: ${data.src || data.srcset}`));
    });
  }

  loadBgImg(element, data) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = data.src;

      img.onload = () => {
        element.style.backgroundImage = `url(${data.src})`;
        resolve();
      };

      img.onerror = () =>
        reject(new Error(`Failed to load background image: ${data.src}`));
    });
  }

  destroy() {
    this.observer.disconnect();
    this.elements.clear();
  }
}
export default LazyLoader;
/*
 *
 @mixin lazy-loader(
   $loader-size: 50px,
   $loader-border: 5px,
   $loader-color: var(--clr-red),
   $loader-bg: var(--clr-rose-50)
   ) {
   &.loader {
   position: relative;
   overflow: hidden;

   &::before {
   content: "";
   position: absolute;
   top: 50%;
   left: 50%;
   translate: -50% -50%;
   height: $loader-size;
   width: $loader-size;
   border: $loader-border solid $loader-color;
   border-left-width: 0px;
   z-index: 10;
   border-radius: 50%;
   animation: loaderspin 1s linear infinite;
   }

   &::after {
   content: "";
   position: absolute;
   height: 100%;
   width: 100%;
   background-color: $loader-bg;
   z-index: 5;
   inset: 0;
   }
   &:has(.loaded) {
   &::before,
   &::after {
   opacity: 0;
   visibility: hidden;
   transition: opacity 0.5s ease-in, visibility 0.5s ease-in;
   }
   }
   }

   img.lazy-load {
   filter: blur(19px);
   opacity: 0;
   transition: opacity 0.5s ease-in, filter 1s ease-in;

   &.loaded {
   opacity: 1;
   filter: blur(0);
   }
   }
   }

   @keyframes loaderspin {
   from {
   transform: rotate(0deg);
   }
   to {
   transform: rotate(360deg);
   }
   }
*/
