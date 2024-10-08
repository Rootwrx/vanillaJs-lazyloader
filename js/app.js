import LazyLoader from "./lazyloader.js";
import Render from "./Render.js";

window.addEventListener("DOMContentLoaded", async () => {
  await Render(".products");
  new LazyLoader().observe('.lazy');
});
