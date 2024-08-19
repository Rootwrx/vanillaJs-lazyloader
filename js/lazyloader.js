// class LazyLoader {
//   constructor(options = {}) {
//     this.options = {
//       loadingClass: "loading",
//       loadedClass: "loaded",
//       selector: "lazy",
//       errorClass: "failed",
//       retryAfter: 100,
//       maxRetries: 3,
//       loadCallback: null,
//       failCallback: null,
//       rootMargin: "0px 0px 100px 0px",
//       threshold: 0.1,
//       fallbackSrc:
//         "https://placehold.co/600x400?text=Original+Image+Has+Failed+!",

//       ...options,
//     };
//     // this.selector = `${this.options.selector.trim()}:not([data-status="${this.options.loadedClass}"],[data-status="${this.options.loadingClass}"])`;
//     this.elements = new Map();
//     this.observer = null;
//     this.lazyImgs = [];

//     // fallback stuff
//     this.fallbackUsed = false;
//     this.srcsetRemoved = false;

//     this.init();
//   }

//   handleIntersection(entries) {
//     if (!this.observer) return;
//     entries.forEach(
//       (entry) => entry.isIntersecting && this.loadElement(entry.target)
//     );
//   }
//   init() {
//     this.lazyImgs = document.querySelectorAll(`.${this.options.selector}`);

//     if (!("IntersectionObserver" in window)) {
//       console.warn("IntersectionObserver is not supported by this browser.");
//       this.loadImagesFallback();
//       return;
//     }
//     this.observer = new IntersectionObserver(
//       this.handleIntersection.bind(this),
//       {
//         rootMargin: this.options.rootMargin,
//         threshold: this.options.threshold,
//       }
//     );
//     this.observe();
//   }

//   observe() {
//     this.lazyImgs.forEach((element) => {
//       if (this.elements.has(element)) return;

//       this.elements.set(element, {
//         src: element.dataset?.src,
//         srcset: element.dataset?.srcset,
//         sizes: element.dataset?.sizes,
//         status: null,
//       });

//       this.observer.observe(element);
//     });
//   }

//   loadImagesFallback() {
//     this.lazyImgs.forEach((image) => image && this.loadElement(image));
//   }

//   async loadElement(element) {
//     const data = this.elements.get(element);
//     if (!data) return;
//     const { loadingClass, loadedClass, loadCallback } = this.options;
//     if (
//       data.status == loadingClass ||
//       data.status == loadedClass ||
//       element.dataset.status == loadedClass
//     )
//       return;
//     data.status = element.dataset.status = loadingClass;
//     element.classList.add(loadingClass);

//     try {
//       if (element.tagName.toLowerCase() === "img")
//         await this.loadImg(element, data);
//       else await this.loadBgImg(element, data);

//       element.classList.replace(loadingClass, loadedClass);
//       element.removeAttribute("data-src");
//       element.removeAttribute("data-srcset");

//       data.status = element.dataset.status = loadedClass;

//       if (typeof loadCallback === "function") {
//       }
//       loadCallback?.(element);
//       this.unobserve(element);
//     } catch (error) {
//       this.handleError(element, data);
//       console.log(error.message);
//     }
//   }

//   handleError(element, data) {
//     if (!data.retries) data.retries = 1;

//     // removing 'loading status' to allow retrying
//     delete data.status;

//     if (data.retries <= this.options.maxRetries) {
//       data.retries += 1;
//       setTimeout(() => this.loadElement(element), this.options.retryAfter);
//     }
//     //!: NOTE :
//     //? When both the srcset and src attributes are present on an <img> element, the browser relies on the srcset attribute first. Here's how it works:

//     //? srcset Attribute: The browser evaluates the srcset attribute to choose the most appropriate image based on the current viewport size, resolution, and other factors such as the sizes attribute (if provided). It selects an image from the srcset list that best matches these conditions.

//     //? src Attribute: If the srcset attribute is not provided or if the browser fails to find a suitable image in the srcset, it falls back to using the src attribute.
//     else {
//       //Todo: Combine these two IFs
//       if (!this.fallbackUsed) {
//         this.fallbackUsed = true;
//         this.options.failCallback?.(element);

//         const newSrc =
//           element.getAttribute("src") != data.src
//             ? element.getAttribute("src")
//             : this.options.fallbackSrc;
//         let newSrcset = element.getAttribute("srcset");
//         newSrcset = newSrcset == data.srcset ? null : newSrcset;

//         if (!newSrcset) element.removeAttribute("srcset");

//         this.elements.set(element, {
//           src: newSrc,
//           srcset: newSrcset,
//         });
//         this.loadElement(element);
//       } else if (!this.srcsetRemoved) {
//         // if the src is set to a valid path or url , then removing the srcset (failed) to allow loading that src
//         console.warn("if src is correct,removing srcset to allow it loading");
//         element.removeAttribute("srcset");
//         // resetting the srcset in map, so it does not use the old broken one (failed)
//         data.srcset = null;
//         this.loadElement(element);
//         this.srcsetRemoved = true;
//       } else this.markAsError(element);
//     }
//   }

//   markAsError(element) {
//     element.dataset.status = "failed";
//     element.classList.replace(
//       this.options.loadingClass,
//       this.options.errorClass
//     );
//     this.unobserve(element);
//     element.removeAttribute("data-src");
//     element.removeAttribute("data-srcset");
//   }

//   unobserve(element) {
//     this.observer.unobserve(element);
//     this.elements.delete(element);
//   }

//   loadImg(img, data) {
//     return new Promise((resolve, reject) => {
//       // checking for lements that only want to be animated when intersecting
//       if (data.src) img.src = data.src;
//       if (data.srcset) img.srcset = data.srcset;
//       if (data.sizes) img.sizes = data.sizes;

//       if (img.complete) {
//         if (!img.naturalWidth)
//           reject(new Error(`Image is broken: ${data.src}`));
//         resolve();
//       } else {
//         img.onload = resolve;
//         img.onerror = () =>
//           reject(new Error(`Failed to load image: ${data.src || img.srcset}`));
//       }
//     });
//   }

//   loadBgImg(element, data) {
//     return new Promise((resolve, reject) => {
//       const img = new Image();

//       if (img.complete) {
//         element.style.backgroundImage = `url(${data.src})`;
//         resolve();
//       } else {
//         img.onload = () => {
//           element.style.backgroundImage = `url(${data.src})`;
//           resolve();
//         };
//         img.onerror = () =>
//           reject(new Error(`Failed to load background image: ${data.src}`));
//       }
//     });
//   }

//   destroy() {
//     if (this.observer) {
//       this.observer.disconnect();
//       this.observer = null;
//     }
//     this.elements.clear();
//   }
// }

// export default LazyLoader;

class LazyLoader {
  constructor(options = {}) {
    this.options = {
      loadingClass: "loading",
      loadedClass: "loaded",
      selector: "lazy",
      errorClass: "failed",
      retryAfter: 100,
      maxRetries: 3,
      loadCallback: null,
      failCallback: null,
      rootMargin: "0px 0px 100px 0px",
      threshold: 0.1,
      fallbackSrc:
        "https://placehold.co/600x400?text=Original+Image+Has+Failed+!",
        
      ...options,
    };

    this.elements = new Map();
    this.observer = null;
    this.fallbackUsed = false;
    this.srcsetRemoved = false;

    this.init();
  }

  init() {
    const lazyElements = document.querySelectorAll(`.${this.options.selector}`);

    if (!("IntersectionObserver" in window)) {
      console.warn("IntersectionObserver is not supported by this browser.");
      this.loadElementsFallback(lazyElements);
      return;
    }

    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      {
        rootMargin: this.options.rootMargin,
        threshold: this.options.threshold,
      }
    );

    this.observeElements(lazyElements);
  }

  observeElements(elements) {
    elements.forEach((element) => {
      if (this.elements.has(element)) return;

      this.elements.set(element, {
        src: element.dataset.src,
        srcset: element.dataset.srcset,
        sizes: element.dataset.sizes,
        status: null,
      });

      this.observer.observe(element);
    });
  }

  handleIntersection(entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        this.loadElement(entry.target);
      }
    });
  }

  async loadElement(element) {
    const data = this.elements.get(element);
    if (!data || data.status === this.options.loadedClass) return;

    data.status = this.options.loadingClass;
    element.classList.add(this.options.loadingClass);

    try {
      await (element.tagName.toLowerCase() === "img"
        ? this.loadImage(element, data)
        : this.loadBackgroundImage(element, data));
      this.markAsLoaded(element);
    } catch (error) {
      this.handleError(element, data, error);
    }
  }

  loadImage(img, data) {
    return new Promise((resolve, reject) => {
      if (data.src) img.src = data.src;
      if (data.srcset) img.srcset = data.srcset;
      if (data.sizes) img.sizes = data.sizes;

      if (img.complete) {
        img.naturalWidth
          ? resolve()
          : reject(new Error(`Image is broken: ${data.src}`));
      } else {
        img.onload = resolve;
        img.onerror = () =>
          reject(new Error(`Failed to load image: ${data.src || img.srcset}`));
      }
    });
  }

  loadBackgroundImage(element, data) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        element.style.backgroundImage = `url(${data.src})`;
        resolve();
      };
      img.onerror = () =>
        reject(new Error(`Failed to load background image: ${data.src}`));
      img.src = data.src;
    });
  }

  markAsLoaded(element) {
    element.classList.replace(
      this.options.loadingClass,
      this.options.loadedClass
    );
    element.removeAttribute("data-src");
    element.removeAttribute("data-srcset");
    element.dataset.status = this.options.loadedClass;
    this.options.loadCallback?.(element);
    this.unobserve(element);
  }

  handleError(element, data) {
    data.retries = (data.retries || 0) + 1;

    if (data.retries <= this.options.maxRetries) {
      console.error(data);
      setTimeout(() => this.loadElement(element), this.options.retryAfter);
    } else if (!this.fallbackUsed) {
      this.tryFallback(element, data);
    } else if (!this.srcsetRemoved) {
      this.removeSrcset(element, data);
    } else {
      this.markAsError(element);
    }
  }

  tryFallback(element, data) {
    this.fallbackUsed = true;
    this.options.failCallback?.(element);
    const newSrc =
      element.getAttribute("src") && element.getAttribute("src") !== data.src
        ? element.getAttribute("src")
        : this.options.fallbackSrc;
    const newSrcset =
      element.getAttribute("srcset") !== data.srcset
        ? element.getAttribute("srcset")
        : null;

    if (!newSrcset) element.removeAttribute("srcset");
    this.elements.set(element, { src: newSrc, srcset: newSrcset });
    this.loadElement(element);
  }

  removeSrcset(element, data) {
    console.log("data : ", data);
    console.warn("Removing srcset to attempt loading with src");
    element.removeAttribute("srcset");
    data.srcset = null;
    this.srcsetRemoved = true;
    this.loadElement(element);
  }

  markAsError(element) {
    element.dataset.status = "failed";
    element.classList.replace(
      this.options.loadingClass,
      this.options.errorClass
    );
    element.removeAttribute("data-src");
    element.removeAttribute("data-srcset");
    this.unobserve(element);
  }

  unobserve(element) {
    this.observer.unobserve(element);
    this.elements.delete(element);
  }

  loadElementsFallback(elements) {
    elements.forEach((element) => this.loadElement(element));
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
