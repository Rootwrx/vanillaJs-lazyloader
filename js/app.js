import LazyLoader from "./lazyloader.js";
import Render from "./Render.js";

window.addEventListener("DOMContentLoaded", async () => {
  await Render(".products");
  const lazyloader = new LazyLoader({
    fallbackSrc: "./images/image-baklava-tablet.jpg",
  });
});
