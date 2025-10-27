# 🛒 Shop ’til u die – Web Components Prototype

This project is a **shopping site prototype** built using modern **Web Components** and **Handlebars.js**.  
It demonstrates how to structure a small e-commerce app where components communicate via **Custom Events** — no frameworks needed.

---

## 🚀 Features
- **Four custom web components**  
  - `<categories-list>` – displays product categories  
  - `<products-list>` – shows products in a selected category with filters and sorting  
  - `<product-details>` – detailed product view with “Add to cart”  
  - `<shopping-cart>` – handles cart items, quantities, and total

- **Data from API:** [Fake Store API](https://fakestoreapi.com)
- **Dynamic templating:** with Handlebars.js  
- **Filter and sorting controls**
- **Quick-add button (+)** for faster cart updates
- **Rating chip** showing ⭐ average rating and review count
- **Responsive layout:** powered by Bootstrap 5
- **Accessibility (a11y):** keyboard navigation, `aria-labels`, and focus styles
- **LocalStorage support:** the cart persists between page reloads

---

## 🧩 Technologies Used
- HTML5 + CSS3  
- JavaScript (ES Modules)  
- Web Components (Custom Elements)  
- Handlebars.js  
- Bootstrap 5  
- Fake Store API

---

## 💡 How It Works
Each component handles its own rendering and data:
- Components **dispatch Custom Events** (`SelectedCategory`, `SelectedProduct`, `AddedToCart`, `CartUpdated`)  
- The main script (`main.js`) switches between views (like a tiny router)
- Cart data is stored and updated in `localStorage`

---

## 🖼️ Screenshots
<img width="2559" height="1193" alt="image" src="https://github.com/user-attachments/assets/88d70a81-6f3a-437f-99a5-b8b35ca304ce" />
<img width="2553" height="1187" alt="image" src="https://github.com/user-attachments/assets/8d29d95b-bb8f-429f-8990-6ae56d465328" />
<img width="2557" height="1193" alt="image" src="https://github.com/user-attachments/assets/afef59e2-2607-4557-9a06-10fbf32faec1" />
<img width="2554" height="1192" alt="image" src="https://github.com/user-attachments/assets/f6cd625c-c55a-4608-a3f8-fc3c17dd988c" />





---

## 🧠 Lessons Learned
- How to build reusable **Web Components** without frameworks  
- How to use **Custom Events** for component communication  
- How to improve **accessibility and responsiveness** with Bootstrap  
- How to integrate data from an external API using **Fetch** and **Handlebars.js**

---

## 👤 Author
**Sam Razavi**  
Student project for *“Komponentdriven webbdesign”*  
Built with ❤️ and a lot of curiosity!
