import Product from "./Product.js";

const Render = async (container) => {
  try {
    const res = await fetch("/js/data.json");
    if (!res.ok) throw new Error("data.json doesn't exit,or Wrong Path !");
    const data = await res.json();
    container = document.querySelector(container);
    const fragment = document.createDocumentFragment();
    data.forEach((obj) => fragment.prepend(Product(obj)));
    container.appendChild(fragment);
  } catch (error) {
    console.log(error);
    throw error;
  } finally {
    setTimeout(() => document.querySelector(".page-loader")?.remove(), 100);
  }
};

export default Render;
