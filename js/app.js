import LazyLoader from "./lazyloader.js";
import Render from "./Render.js";

window.addEventListener("DOMContentLoaded", async () => {
  await Render(".products");
  const lazyloader = new LazyLoader({
    failCallback: (img) => {
      img.src =
        "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse1.mm.bing.net%2Fth%3Fid%3DOIP.EvvujZX1nk-nfOhwt2q1dgHaEF%26pid%3DApi&f=1&ipt=907fe51b42d12be612069275a3fa5c45c39808195b245782fd18f75e4b9372d0&ipo=images";
    }
  });
});
