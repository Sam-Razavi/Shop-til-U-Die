// js/components/hello-box.js
class HelloBox extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="card shadow-sm">
        <div class="card-body">
          <h5 class="card-title mb-2">Web Components are working 🎉</h5>
          <p class="card-text mb-0">
            Next, we’ll create the real components: Categories, Products, ProductDetails, and ShoppingCart.
          </p>
        </div>
      </div>
    `;
  }
}

customElements.define('hello-box', HelloBox);
