// js/components/shopping-cart.js

// Mall (HTML) för kundvagnen. Handlebars fyller in data i {{...}}.
const CART_TEMPLATE = `
  <div class="card shadow-sm">
    <div class="card-body">
      <h5 class="card-title mb-3">Kundvagn</h5>

      {{#if items.length}}
        <div class="table-responsive">
          <table class="table align-middle">
            <!-- [NYTT] Caption hjälper skärmläsare förstå vad tabellen visar -->
            <caption class="visually-hidden">Innehåll i kundvagn</caption>
            <thead>
              <tr>
                <!-- [NYTT] scope="col" förbättrar tabellens semantik -->
                <th scope="col">Produkt</th>
                <th scope="col" class="text-end">Pris</th>
                <th scope="col" style="width:160px;" class="text-center">Antal</th>
                <th scope="col" class="text-end">Delsumma</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              {{#each items}}
                <!-- Varje rad representerar en produkt i vagnen. data-id = produktens id -->
                <tr data-id="{{id}}">
                  <td>
                    <div class="d-flex align-items-center gap-2">
                      <!-- [NYTT] loading="lazy" gör att bilder laddas först när de syns -->
                      <img
                        loading="lazy"
                        src="{{image}}"
                        alt="{{title}}"
                        style="width:48px; height:48px; object-fit:contain;"
                        class="border rounded p-1"
                        data-action="view"
                      >
                      <div>
                        <!-- Klick på titel eller bild visar produktsidan -->
                        <a href="#"
                           class="fw-semibold small text-decoration-none"
                           data-action="view">{{title}}</a>
                        <div class="text-muted small">{{category}}</div>
                      </div>
                    </div>
                  </td>
                  <!-- Pris per styck -->
                  <td class="text-end">{{formatPrice price}} $</td>
                  <td class="text-center">
                    <!-- Knappgrupp för att minska/öka antal -->
                    <div class="btn-group btn-group-sm" role="group" aria-label="qty">
                      <!-- [NYTT] type="button" är bra vana (undviker oönskad form-submit) -->
                      <button type="button" class="btn btn-outline-secondary" data-action="dec">−</button>
                      <!-- Visar antal (disabled knapp används som enkel "badge") -->
                      <span class="btn btn-light disabled">{{qty}}</span>
                      <button type="button" class="btn btn-outline-secondary" data-action="inc">+</button>
                    </div>
                  </td>
                  <!-- Delsumma = pris * antal -->
                  <td class="text-end">{{formatPrice subtotal}} $</td>
                  <td class="text-end">
                    <button type="button" class="btn btn-sm btn-outline-danger" data-action="remove">Ta bort</button>
                  </td>
                </tr>
              {{/each}}
              <!-- Summering längst ner -->
              <tr>
                <td colspan="3" class="text-end fw-semibold">Totalt</td>
                <td class="text-end fw-bold">{{formatPrice total}} $</td>
                <td></td>
              </tr>
            </tbody>
          </table>
          <!-- [NYTT] Live-region som meddelar ny totalsumma till skärmläsare -->
          <div id="cartLive" class="visually-hidden" aria-live="polite"></div>
        </div>
        <!-- Åtgärdsknappar: töm vagn / checkout (demobesked) -->
        <div class="d-flex justify-content-end gap-2">
          <button type="button" class="btn btn-outline-secondary" id="btnClear">Töm kundvagn</button>
          <button type="button" class="btn btn-success" id="btnCheckout">Gå till checkout</button>
        </div>
      {{else}}
        <!-- När vagnen är tom -->
        <p>Kundvagnen är tom. Lägg till en produkt.</p>
      {{/if}}
    </div>
  </div>
`;

class ShoppingCart extends HTMLElement {
  constructor() {
    super();
    // Försök läsa inlagrade varor från localStorage (så vagnen bevaras mellan sidladdningar)
    const saved = localStorage.getItem('cart-items');
    this._items = saved ? JSON.parse(saved) : [];

    // Handlebars-hjälpare för prisformat (t.ex. 12.00)
    if (!Handlebars.helpers.formatPrice) {
      Handlebars.registerHelper('formatPrice', (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? n.toFixed(2) : v;
      });
    }

    // Kompilera mallen en gång
    this._template = Handlebars.compile(CART_TEMPLATE);

    // Lyssna globalt: när något läggs i kundvagn (från product-details eller quick-add)
    document.addEventListener('AddedToCart', (e) => {
      const { product, quantity } = e.detail;
      this._add(product, quantity);
    });
  }

  connectedCallback() {
    // Första render
    this._render();

    // Händelsedelegering: fångar klick på knappar/länkar inne i komponenten
    this.addEventListener('click', (e) => {
      const row = e.target.closest('tr[data-id]');   // Hitta vilken rad (produkt) som klicket tillhör
      const action = e.target.getAttribute('data-action'); // Vilken åtgärd? inc/dec/remove/view

      if (row && action) {
        const id = Number(row.getAttribute('data-id'));

        // Öka/minska antal
        if (action === 'inc') this._changeQty(id, +1);
        if (action === 'dec') this._changeQty(id, -1);

        // Ta bort produkt
        if (action === 'remove') this._remove(id);

        // Visa produktsida när man klickar på bild eller titel
        if (action === 'view') {
          // Skicka event uppåt: main.js fångar och laddar produkt + visar details
          this.dispatchEvent(new CustomEvent('ViewProductFromCart', {
            detail: { id },
            bubbles: true,
            composed: true
          }));
          e.preventDefault(); // Stoppa länken från att hoppa upp på sidan
          return;
        }
      }

      // Töm hela kundvagnen
      if (e.target?.id === 'btnClear') {
        this._clear();
      }

      // Demo: på riktigt hade vi gått vidare till en kassasida
      if (e.target?.id === 'btnCheckout') {
        alert('Demo: här skulle checkout starta 🛒');
      }
    });
  }

  // ---------- Logik för att hantera varor i kundvagnen ----------

  // Lägg till produkt i vagnen (eller öka antal om den redan finns)
  _add(product, qty = 1) {
    const q = Math.max(1, parseInt(qty, 10) || 1);
    const existing = this._items.find(it => it.id === product.id);

    if (existing) {
      existing.qty += q; // Om produkten finns redan, öka antal
    } else {
      // Annars läggs en ny rad/produkt in
      this._items.push({
        id: product.id,
        title: product.title,
        price: Number(product.price),
        image: product.image,
        category: product.category,
        qty: q,
      });
    }
    this._persist(); // Spara och meddela att vagnen uppdaterats
    this._render();  // Rita om tabellen
  }

  // Ändra antalet för en specifik produkt (delta = +1 eller -1)
  _changeQty(id, delta) {
    const it = this._items.find(x => x.id === id);
    if (!it) return;
    it.qty += delta;

    // Om antal går ner till 0 eller mindre, ta bort produkten
    if (it.qty <= 0) {
      this._items = this._items.filter(x => x.id !== id);
    }
    this._persist();
    this._render();
  }

  // Ta bort en produkt helt
  _remove(id) {
    this._items = this._items.filter(x => x.id !== id);
    this._persist();
    this._render();
  }

  // Töm allt i vagnen
  _clear() {
    this._items = [];
    this._persist();
    this._render();
  }

  // Spara i localStorage + skicka event + uppdatera live-region
  _persist() {
    localStorage.setItem('cart-items', JSON.stringify(this._items));

    // [NYTT] Uppdatera live-region med ny totalsumma (för skärmläsare)
    const live = this.querySelector('#cartLive');
    if (live) {
      const t = this._calcTotal();
      const fmt = new Intl.NumberFormat('sv-SE', { style:'currency', currency:'USD' }).format(t);
      live.textContent = `Kundvagn uppdaterad. Ny totalsumma: ${fmt}.`;
    }

    // Skicka event uppåt så navbar-badge m.m. kan uppdateras
    this.dispatchEvent(new CustomEvent('CartUpdated', {
      detail: { items: this._items, total: this._calcTotal() },
      bubbles: true,
      composed: true
    }));
  }

  // Räkna framm totalbeloppet
  _calcTotal() {
    return this._items.reduce((sum, it) => sum + it.price * it.qty, 0);
  }

  // Gör om interna data till ett "view model" som mallen förstår
  _viewModel() {
    const items = this._items.map(it => ({
      ...it,
      subtotal: it.price * it.qty
    }));
    return { items, total: this._calcTotal() };
  }

  // ---------- Render (rita om HTML från mallen) ----------
  _render() {
    this.innerHTML = this._template(this._viewModel());
  }
}

// Registrera vår webkomponent <shopping-cart>
customElements.define('shopping-cart', ShoppingCart);
