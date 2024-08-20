class LazyLoader {
  constructor(options = {}) {
    this.options = {
      root: null,
      rootMargin: "0px",
      threshold: 0.1,
      maxRetries: 3,
      retryDelay: 2000,
      timeout: 10000,
      debugMode: false,
      ...options,
    };
    this.observer = null;
    this.loadingImages = new Map();
    this.init();
  }

  init() {
    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      {
        root: this.options.root,
        rootMargin: this.options.rootMargin,
        threshold: this.options.threshold,
      }
    );
    this.debug("ImageLazyLoader initialized");
  }

  observe(selector) {
    const images = document.querySelectorAll(selector);
    images.forEach((img) => {
      if (img.dataset.src) {
        this.observer.observe(img);
        this.debug(`Observing image: ${img.dataset.src}`);
      }
    });
  }

  handleIntersection(entries, observer) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        this.loadImage(img);
        observer.unobserve(img);
      }
    });
  }

  async loadImage(img, retryCount = 0) {
    const src = img.dataset.src;
    if (!src) return;

    this.debug(`Loading image: ${src} (Attempt: ${retryCount + 1})`);

    try {
      await this.fetchImage(src);
      this.applyImage(img, src);
      this.debug(`Successfully loaded image: ${src}`);
    } catch (error) {
      this.handleError(img, src, error, retryCount);
    }
  }

  fetchImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      let timeout;

      const cleanup = () => {
        img.onload = img.onerror = null;
        clearTimeout(timeout);
      };

      img.onload = () => {
        cleanup();
        resolve(img);
      };

      img.onerror = () => {
        cleanup();
        reject(new Error(`Failed to load image: ${src}`));
      };

      timeout = setTimeout(() => {
        cleanup();
        reject(new Error(`Timeout loading image: ${src}`));
      }, this.options.timeout);

      img.src = src;
    });
  }

  applyImage(img, src) {
    img.src = src;
    img.removeAttribute("data-src");
    img.classList.add("loaded");
  }

  handleError(img, src, error, retryCount) {
    this.debug(`Error loading image: ${src}`, error);

    if (retryCount < this.options.maxRetries) {
      this.debug(`Retrying image: ${src} (Attempt: ${retryCount + 2})`);
      setTimeout(() => {
        this.loadImage(img, retryCount + 1);
      }, this.options.retryDelay);
    } else {
      this.debug(`Max retries reached for image: ${src}`);
      this.applyErrorState(img);
    }
  }

  applyErrorState(img) {
    img.classList.add("failed");
    const errorMsg = document.createElement("span");
    errorMsg.classList.add("failure-message");
    errorMsg.textContent = "Failed to load image";
    img.parentNode.insertBefore(errorMsg, img.nextSibling);
  }

  debug(...args) {
    if (this.options.debugMode) {
      console.log("[LazyLoader]", ...args);
    }
  }
}

export default LazyLoader;
