class LazyLoader {
  constructor(options = {}) {
    this.options = {
      loadingClass: "loading",
      loadedClass: "loaded",
      selector: "lazy",
      errorClass: "failed",
      retryAfter: 600,
      maxRetries: 4,
      loadCallback: null,
      failCallback: null,
      useFallbackImg: true,
      rootMargin: "0px 0px 100px 0px",
      threshold: 0.1,
      fallbackSrc:
        "https://placehold.co/600x400?text=Original+Image+Has+Failed+!",

      ...options,
    };

    this.elements = new Map();
    this.observer = null;
    this.fallBackSrcUsed = false;
    this.faiCallbackUsed = false;
    this.removeSrcset = false;

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
    entries.forEach(
      (entry) => entry.isIntersecting && this.loadElement(entry.target)
    );
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

  handleError(element, data, error) {
    console.error(error.message);
    data.retries = (data.retries || 0) + 1;

    if (data.retries <= this.options.maxRetries) {
      setTimeout(() => this.loadElement(element), this.options.retryAfter);
    } else if (!this.faiCallbackUsed) {
      this.useFailCallback(element, data);
    } else if (!this.fallBackSrcUsed && this.options.useFallbackImg) {
      this.useFallbackSrc(element, data);
    } else if (!this.removeSrcset) {
      //? why removing srcset ?
      //* well, a even if img has a valid src, it will fail if it has a non-valid srcset
      console.warn("Removing potentiel broken srcset");
      this.removeSrcset = true;
      element.srcset = "";
      data.srcset = null;
      this.loadElement(element);
    } else this.markAsError(element);
  }

  useFailCallback(element, data) {
    this.faiCallbackUsed = true;
    this.options.failCallback?.(element);

    const newSrc = element.getAttribute("src");
    const newSrcset = element.getAttribute("srcset");

    this.elements.set(element, {
      ...data,
      src: newSrc,
      srcset: newSrcset || null,
    });
    this.loadElement(element);
  }

  useFallbackSrc(element, data) {
    this.fallBackSrcUsed = true;
    console.warn("Using fallback src as last resort");

    element.removeAttribute("srcset");
    this.elements.set(element, {
      ...data,
      src: this.options.fallbackSrc,
      srcset: null,
    });
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
