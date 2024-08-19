class LazyLoader {
  constructor(options = {}) {
    this.options = {
      loadingClass: "loading",
      loadedClass: "loaded",
      selector: "lazy",
      errorClass: "failed",
      retryAfter: 2000,
      maxRetries: 3,
      loadCallback: null,
      failCallback: null,
      rootMargin: "0px 0px 100px 0px",
      threshold: 0.1,
      fallbackSrc:
        "https://placehold.co/600x400?text=Original+Image+Has+Failed+!",

      ...options,
    };
    // this.selector = `${this.options.selector.trim()}:not([data-status="${this.options.loadedClass}"],[data-status="${this.options.loadingClass}"])`;
    this.fallbackUsed = false;
    this.elements = new Map();
    this.observer = null;
    this.lazyImgs = [];
    this.init();
  }

  handleIntersection(entries) {
    if (!this.observer) return;
    entries.forEach(
      (entry) => entry.isIntersecting && this.loadElement(entry.target)
    );
  }
  init() {
    this.lazyImgs = document.querySelectorAll(`.${this.options.selector}`);

    if (!("IntersectionObserver" in window)) {
      console.warn("IntersectionObserver is not supported by this browser.");
      this.loadImagesFallback();
      return;
    }
    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      {
        rootMargin: this.options.rootMargin,
        threshold: this.options.threshold,
      }
    );
    this.observe();
  }

  observe() {
    this.lazyImgs.forEach((element) => {
      if (this.elements.has(element)) return;

      this.elements.set(element, {
        src: element.dataset?.src,
        srcset: element.dataset?.srcset,
        sizes: element.dataset?.sizes,
        status: null,
      });

      this.observer.observe(element);
    });
  }

  loadImagesFallback() {
    this.lazyImgs.forEach((image) => image && this.loadElement(image));
  }

  async loadElement(element) {
    const data = this.elements.get(element);
    if (!data) return;
    const { loadingClass, loadedClass, loadCallback } = this.options;
    if (
      data.status == loadingClass ||
      data.status == loadedClass ||
      element.dataset.status == loadedClass
    )
      return;
    data.status = element.dataset.status = loadingClass;
    element.classList.add(loadingClass);

    try {
      if (element.tagName.toLowerCase() === "img")
        await this.loadImg(element, data);
      else await this.loadBgImg(element, data);

      element.classList.replace(loadingClass, loadedClass);
      element.removeAttribute("data-src");
      element.removeAttribute("data-srcset");

      data.status = element.dataset.status = loadedClass;

      if (typeof loadCallback === "function") {
      }
      loadCallback?.(element);
      this.unobserve(element);
    } catch (error) {
      this.handleError(element, data);
      console.log(error.message);
    }
  }

  handleError(element, data) {
    if (!data.retries) data.retries = 1;

    // removing 'loading status' to allow retrying
    delete data.status;

    if (data.retries <= this.options.maxRetries) {
      data.retries += 1;
      setTimeout(() => this.loadElement(element), this.options.retryAfter);
    }
    // else this.markAsError(element);

    //!: NOTE :
    //? When both the srcset and src attributes are present on an <img> element, the browser relies on the srcset attribute first. Here's how it works:

    //? srcset Attribute: The browser evaluates the srcset attribute to choose the most appropriate image based on the current viewport size, resolution, and other factors such as the sizes attribute (if provided). It selects an image from the srcset list that best matches these conditions.

    //? src Attribute: If the srcset attribute is not provided or if the browser fails to find a suitable image in the srcset, it falls back to using the src attribute.
    else {
      //Todo: Combine these two IFs
      // try to apply fallback img
      // if (!this.fallbackUsed) {
      //   console.warn(`Using fallback image ${this.options.fallbackSrc}`);
      //   element.onerror = () => this.markAsError(element);
      //   // using fallbackused to avoid infinite error loading loop if the fallback img also fails !
      //   this.fallbackUsed = true;
      //   this.elements.set(element, {
      //     // src: this.options.fallbackSrc + "?" + new Date().getTime(), // this works
      //     src: this.options.fallbackSrc,
      //   });
      //   // this is insane !!!! if you don't remove it ! the fallback img will never load ,it will try load  the failed srcset
      //   element.removeAttribute("srcset"); // 2  days or more wasted because of that
      //   this.loadElement(element);
      // } else {
      //   this.markAsError(element);
      // }

      if (
        typeof this.options.failCallback == "function" &&
        !this.fallbackUsed
      ) {
        this.fallbackUsed = true;
        this.options.failCallback(element);
        const newSrc = element.getAttribute("src");
        let newSrcset = element.getAttribute("srcset");

        if (newSrc !== data.src || newSrcset !== data.srcset) {
          console.log(newSrcset == data.srcset);
          if (newSrcset == data.srcset) {
            // removing if new fallback src changed to force the browser use 'src'
            element.removeAttribute("srcset");
            newSrcset = null;
          }
          this.elements.set(element, {
            src: newSrc,
            src: newSrcset,
          });
          this.loadElement(element);
        } else this.markAsError(element);
      } else this.markAsError(element);
    }
  }


  markAsError(element) {
    element.dataset.status = "failed";
    element.classList.replace(
      this.options.loadingClass,
      this.options.errorClass
    );
    this.unobserve(element);
    element.removeAttribute("data-src");
    element.removeAttribute("data-srcset");
    this.options.failCallback?.(element);
  }

  unobserve(element) {
    this.observer.unobserve(element);
    this.elements.delete(element);
  }

  loadImg(img, data) {
    return new Promise((resolve, reject) => {
      // checking for lements that only want to be animated when intersecting
      if (data.src) img.src = data.src;
      if (data.srcset) img.srcset = data.srcset;
      if (data.sizes) img.sizes = data.sizes;

      if (img.complete) {
        if (!img.naturalWidth)
          reject(new Error(`Image is broken: ${data.src}`));
        resolve();
      } else {
        img.onload = resolve;
        img.onerror = () =>
          reject(new Error(`Failed to load image: ${data.src || img.srcset}`));
      }
    });
  }

  loadBgImg(element, data) {
    return new Promise((resolve, reject) => {
      const img = new Image();

      if (img.complete) {
        element.style.backgroundImage = `url(${data.src})`;
        resolve();
      } else {
        img.onload = () => {
          element.style.backgroundImage = `url(${data.src})`;
          resolve();
        };
        img.onerror = () =>
          reject(new Error(`Failed to load background image: ${data.src}`));
      }
    });
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.elements.clear();
  }
}

export default LazyLoader;
