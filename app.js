// ====== CONFIGURACIÓN ======
const WHATSAPP = "573000000000"; // Cambia por tu número (código de país + número)
const fmt = n => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

// Catálogo de ejemplo: edita, agrega o elimina productos aquí
const PRODUCTS = [
  { id: 1, name: "Ryzen 5 7600X", cat: "Procesadores", icon: "🧠", price: 980000, desc: "6 núcleos, 12 hilos, socket AM5." },
  { id: 2, name: "Intel Core i7-13700K", cat: "Procesadores", icon: "🧠", price: 1650000, desc: "16 núcleos, hasta 5.4 GHz." },
  { id: 3, name: "GeForce RTX 4060 8GB", cat: "Tarjetas gráficas", icon: "🎮", price: 1450000, desc: "Ideal para 1080p y 1440p." },
  { id: 4, name: "Radeon RX 7700 XT", cat: "Tarjetas gráficas", icon: "🎮", price: 1890000, desc: "12 GB GDDR6, alto rendimiento." },
  { id: 5, name: "Corsair Vengeance 16GB DDR5", cat: "Memoria RAM", icon: "💾", price: 380000, desc: "Kit 2x8GB, 5600 MHz." },
  { id: 6, name: "Kingston Fury 32GB DDR4", cat: "Memoria RAM", icon: "💾", price: 420000, desc: "Kit 2x16GB, 3200 MHz." },
  { id: 7, name: "SSD NVMe 1TB Gen4", cat: "Almacenamiento", icon: "⚡", price: 330000, desc: "Lectura hasta 7000 MB/s." },
  { id: 8, name: "HDD 4TB 7200 RPM", cat: "Almacenamiento", icon: "💽", price: 520000, desc: "Para respaldo y archivos grandes." },
  { id: 9, name: "Board B650M", cat: "Tarjetas madre", icon: "🔌", price: 720000, desc: "AM5, DDR5, M.2 y WiFi." },
  { id: 10, name: "Fuente 650W 80+ Bronze", cat: "Fuentes", icon: "🔋", price: 290000, desc: "Eficiente y silenciosa." },
  { id: 11, name: "Gabinete ATX Airflow", cat: "Gabinetes", icon: "🖥️", price: 260000, desc: "Panel de vidrio y 3 ventiladores." },
  { id: 12, name: "Cooler Líquido 240mm", cat: "Refrigeración", icon: "❄️", price: 340000, desc: "AIO con iluminación ARGB." }
];

// Descuentos mayoristas por cantidad total de unidades
const DISCOUNTS = [{ min: 10, pct: 10 }, { min: 5, pct: 5 }];

// ====== ESTADO ======
let cart = JSON.parse(localStorage.getItem("cart") || "[]");
let activeCat = "Todos";

const $ = id => document.getElementById(id);

// ====== CATÁLOGO ======
function renderFilters() {
  const cats = ["Todos", ...new Set(PRODUCTS.map(p => p.cat))];
  $("filters").innerHTML = cats.map(c => `<button class="chip ${c === activeCat ? "active" : ""}" data-cat="${c}">${c}</button>`).join("");
}

function renderProducts() {
  const q = $("search").value.trim().toLowerCase();
  const list = PRODUCTS.filter(p =>
    (activeCat === "Todos" || p.cat === activeCat) &&
    (p.name + p.cat + p.desc).toLowerCase().includes(q)
  );
  $("products").innerHTML = list.map(p => `
    <article class="product">
      <div class="product__icon">${p.icon}</div>
      <small>${p.cat}</small>
      <h3>${p.name}</h3>
      <p>${p.desc}</p>
      <div class="product__foot">
        <span class="price">${fmt(p.price)}</span>
        <button class="add" data-id="${p.id}">Agregar</button>
      </div>
    </article>`).join("");
  $("empty").hidden = list.length > 0;
}

// ====== CARRITO ======
function save() { localStorage.setItem("cart", JSON.stringify(cart)); }

function addToCart(id) {
  const item = cart.find(i => i.id === id);
  item ? item.qty++ : cart.push({ id, qty: 1 });
  save(); renderCart(); openCart();
}

function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
  save(); renderCart();
}

function totals() {
  const units = cart.reduce((s, i) => s + i.qty, 0);
  const subtotal = cart.reduce((s, i) => s + i.qty * PRODUCTS.find(p => p.id === i.id).price, 0);
  const rule = DISCOUNTS.find(d => units >= d.min);
  const pct = rule ? rule.pct : 0;
  const discount = Math.round(subtotal * pct / 100);
  return { units, subtotal, pct, discount, total: subtotal - discount };
}

function renderCart() {
  const t = totals();
  $("cartCount").textContent = t.units;
  $("cartItems").innerHTML = cart.length ? cart.map(i => {
    const p = PRODUCTS.find(x => x.id === i.id);
    return `<div class="item">
      <div><div class="item__name">${p.name}</div><div class="item__price">${fmt(p.price)} c/u</div></div>
      <strong>${fmt(p.price * i.qty)}</strong>
      <div class="qty">
        <button data-act="minus" data-id="${p.id}">−</button><span>${i.qty}</span><button data-act="plus" data-id="${p.id}">+</button>
      </div>
      <button class="remove" data-act="remove" data-id="${p.id}">Quitar</button>
    </div>`;
  }).join("") : `<p class="cart__empty">Tu carrito está vacío.</p>`;
  $("subtotal").textContent = fmt(t.subtotal);
  $("discLabel").textContent = `Descuento mayorista (${t.pct}%)`;
  $("discount").textContent = "-" + fmt(t.discount);
  $("total").textContent = fmt(t.total);
  document.querySelector(".row.discount").style.display = t.pct ? "flex" : "none";
}

function openCart() { $("cart").classList.add("open"); $("overlay").classList.add("show"); }
function closeCart() { $("cart").classList.remove("open"); $("overlay").classList.remove("show"); }

function checkout() {
  if (!cart.length) return alert("Agrega productos al carrito primero.");
  const t = totals();
  const lines = cart.map(i => {
    const p = PRODUCTS.find(x => x.id === i.id);
    return `• ${i.qty} x ${p.name} (${fmt(p.price * i.qty)})`;
  });
  const msg = `Hola, quiero hacer este pedido:\n${lines.join("\n")}\n\nSubtotal: ${fmt(t.subtotal)}\nDescuento: ${t.pct}%\nTotal: ${fmt(t.total)}`;
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, "_blank");
}

// ====== FORMULARIO MAYORISTA ======
$("wholesaleForm").addEventListener("submit", e => {
  e.preventDefault();
  const f = e.target, msg = $("formMsg");
  const ok = f.nombre.value.trim() && f.empresa.value.trim() && /^\S+@\S+\.\S+$/.test(f.email.value) && f.volumen.value;
  msg.className = "form-msg " + (ok ? "ok" : "error");
  msg.textContent = ok ? "¡Gracias! Un asesor te contactará pronto." : "Completa todos los campos con un correo válido.";
  // Aquí puedes enviar los datos a tu backend o a un servicio como Formspree
  if (ok) f.reset();
});

// ====== EVENTOS ======
$("filters").addEventListener("click", e => {
  if (!e.target.dataset.cat) return;
  activeCat = e.target.dataset.cat; renderFilters(); renderProducts();
});
$("search").addEventListener("input", renderProducts);
$("products").addEventListener("click", e => { if (e.target.dataset.id) addToCart(+e.target.dataset.id); });
$("cartItems").addEventListener("click", e => {
  const { act, id } = e.target.dataset;
  if (!act) return;
  if (act === "plus") changeQty(+id, 1);
  if (act === "minus") changeQty(+id, -1);
  if (act === "remove") changeQty(+id, -999);
});
$("openCart").addEventListener("click", openCart);
$("closeCart").addEventListener("click", closeCart);
$("overlay").addEventListener("click", closeCart);
$("checkout").addEventListener("click", checkout);
$("clear").addEventListener("click", () => { cart = []; save(); renderCart(); });
$("burger").addEventListener("click", () => $("nav").classList.toggle("open"));
$("nav").addEventListener("click", () => $("nav").classList.remove("open"));

renderFilters(); renderProducts(); renderCart();
