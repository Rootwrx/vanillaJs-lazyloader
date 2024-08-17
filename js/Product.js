const ImgName = (imagePath) => imagePath.slice(0, imagePath.lastIndexOf("."));

const Product = ({
  price,
  category,
  name,
  image: { mobile, desktop, tablet },
}) => {
  const product = document.createElement("div");
  product.classList.add("product","loader");
  product.innerHTML = `
            <div class="product-image">
                <img
                  src="${ImgName(mobile)}_blurred.jpg"
                  data-src="${desktop}"
                  data-srcset="
                    ${mobile}  654w,
                    ${tablet}  427w,
                    ${desktop} 502w
                  "
                  alt="${name}"
                  class="lazy-load"
                />
               
            <section class="product-details">
              <h3 class="product-category">${category}</h3>
              <h4 class="product-name">${name}</h4>
              <span class="product-price">$${price.toFixed(2)}</span>
            </section>
  `;
  return product;
};

export default Product;
