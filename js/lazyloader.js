class LazyLoader {
  constructor(options = {}) {
    this.options = {
      loadingClass: "loading",
      loadedClass: "loaded",
      selector: ".lazy-load",
      errorClass: "failed",
      retryAfter: 2000,
      maxRetries: 4,
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
    if (!this.observer) return;
    for (const entry of entries) {
      if (entry.isIntersecting) {
        this.loadElement(entry.target);
      }
    }

    if (this.elements.size === 0) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
  init() {
    this.lazyImgs = Array.from(
      document.querySelectorAll(this.options.selector)
    );
    if (!"IntersectionObserver" in window) {
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
    if (data.status == loadingClass) {
      console.log(element);
    }
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
      loadCallback?.();
      this.unobserve(element);
    } catch (error) {
      this.handleError(element, data);
      throw error;
    }
  }

  handleError(element, data) {
    if (!data.retries) data.retries = 1;
    // removing 'loading status' to allow retrying
    delete data.status;
    if (data.retries < this.options.maxRetries) {
      console.log("Retrying loading ", element);
      data.retries += 1;
      setTimeout(() => this.loadElement(element), this.options.retryAfter);
    } else this.markAsError(element);
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
  }

  unobserve(element) {
    this.observer.unobserve(element);
    this.elements.delete(element);
  }

  loadImg(img, data) {
    return new Promise((resolve, reject) => {
      if (data.src) img.src = data.src;
      if (data.srcset) img.srcset = data.srcset;

      // if image is already downloaded or cached before it intersects the viewport
      if (img.complete) resolve();
      else {
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
