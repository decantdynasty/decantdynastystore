/* ============================================================
   DECANT DYNASTY — APPLICATION LOGIC
   Vanilla JS SPA. No build step required — drop into public/
   alongside data.js and it runs as-is.
   ============================================================ */
(function(){
"use strict";

/* ---------------- storage layer (with safe fallback) ---------------- */
const memoryStore = {};
async function storeGet(key, shared){
  try{
    if(window.storage && window.storage.get){
      const r = await window.storage.get(key, !!shared);
      return r ? r.value : null;
    }
  }catch(e){ /* key not found or unavailable */ }
  return memoryStore[key] ?? null;
}
async function storeSet(key, value, shared){
  try{
    if(window.storage && window.storage.set){
      await window.storage.set(key, value, !!shared);
      return true;
    }
  }catch(e){}
  memoryStore[key] = value;
  return false;
}
async function storeDelete(key, shared){
  try{
    if(window.storage && window.storage.delete){
      await window.storage.delete(key, !!shared);
      return true;
    }
  }catch(e){}
  delete memoryStore[key];
  return false;
}
async function storeList(prefix, shared){
  try{
    if(window.storage && window.storage.list){
      const r = await window.storage.list(prefix, !!shared);
      return r ? r.keys : [];
    }
  }catch(e){}
  return Object.keys(memoryStore).filter(k=>k.startsWith(prefix||""));
}

/* ---------------- sound manager ---------------- */
const sounds = {
  click: new Audio('sounds/click.mp3'),
  toggle: new Audio('sounds/toggle.mp3'),
  search: new Audio('sounds/search.mp3'),
  result: new Audio('sounds/result.mp3'),
  muted: false
};
function playSound(name){
  if(sounds.muted || !sounds[name]) return;
  sounds[name].currentTime = 0;
  sounds[name].play().catch(()=>{});
}

/* ---------------- 3D Bottle ---------------- */
let bottleScene, bottleCamera, bottleRenderer, bottleMesh;
function initHeroBottle(){
  const container = document.getElementById('heroBottleContainer');
  if(!container) return;
  
  const width = container.clientWidth;
  const height = container.clientHeight;
  
  bottleScene = new THREE.Scene();
  bottleCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  bottleCamera.position.z = 5;
  
  bottleRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  bottleRenderer.setSize(width, height);
  bottleRenderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(bottleRenderer.domElement);
  
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  bottleScene.add(ambientLight);
  
  const pointLight = new THREE.PointLight(0xffffff, 1);
  pointLight.position.set(5, 5, 5);
  bottleScene.add(pointLight);

  const bottleGroup = new THREE.Group();

  // Bottle body
  const bodyGeo = new THREE.CylinderGeometry(0.8, 0.8, 2.5, 32);
  const bodyMat = new THREE.MeshPhysicalMaterial({ 
    color: 0xffffff, 
    metalness: 0.1, 
    roughness: 0.1, 
    transmission: 0.9, 
    thickness: 0.5, 
    transparent: true 
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  bottleGroup.add(body);

  // Bottle neck
  const neckGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.5, 32);
  const neck = new THREE.Mesh(neckGeo, bodyMat);
  neck.position.y = 1.5;
  bottleGroup.add(neck);

  // Bottle cap
  const capGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.6, 32);
  const capMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.2 });
  const cap = new THREE.Mesh(capGeo, capMat);
  cap.position.y = 1.9;
  bottleGroup.add(cap);

  bottleMesh = bottleGroup;
  bottleScene.add(bottleMesh);

  let isDragging = false;
  let previousMouseX = 0;
  let previousMouseY = 0;
  let targetRotationX = 0;
  let targetRotationY = 0;

  container.addEventListener('mousedown', (e) => { isDragging = true; });
  container.addEventListener('touchstart', (e) => { isDragging = true; previousMouseX = e.touches[0].clientX; previousMouseY = e.touches[0].clientY; });
  
  window.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const deltaX = e.clientX - previousMouseX;
      const deltaY = e.clientY - previousMouseY;
      targetRotationY += deltaX * 0.01;
      targetRotationX += deltaY * 0.01;
    }
    previousMouseX = e.clientX;
    previousMouseY = e.clientY;
  });

  window.addEventListener('touchmove', (e) => {
    if (isDragging) {
      const deltaX = e.touches[0].clientX - previousMouseX;
      const deltaY = e.touches[0].clientY - previousMouseY;
      targetRotationY += deltaX * 0.01;
      targetRotationX += deltaY * 0.01;
    }
    previousMouseX = e.touches[0].clientX;
    previousMouseY = e.touches[0].clientY;
  }, { passive: false });

  window.addEventListener('mouseup', () => { isDragging = false; });
  window.addEventListener('touchend', () => { isDragging = false; });

  function animate() {
    requestAnimationFrame(animate);
    
    if (!isDragging) {
      bottleMesh.rotation.y += 0.005; // Auto rotate
    } else {
      bottleMesh.rotation.y += (targetRotationY - bottleMesh.rotation.y) * 0.1;
      bottleMesh.rotation.x += (targetRotationX - bottleMesh.rotation.x) * 0.1;
    }
    
    bottleRenderer.render(bottleScene, bottleCamera);
  }
  animate();

  window.addEventListener('resize', () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    bottleCamera.aspect = w / h;
    bottleCamera.updateProjectionMatrix();
    bottleRenderer.setSize(w, h);
  });
}

/* ---------------- state ---------------- */
const state = {
  theme: "dark",
  cart: [],        // {productId, size, qty}
  wishlist: [],     // productId[]
  overrides: {},    // productId -> {name,image,image2,prices,description,concentration,gender,longevity,projection,topNotes,heartNotes,baseNotes,verified}
  brandOverrides: {}, // brandId -> {logo,name}
  content: null,    // editable site copy — see DEFAULT_CONTENT
  route: {page:"home"},
};

const WHY_ICONS = [
  "M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  "M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z",
  "M12 21C7 17 3 13.5 3 9a5 5 0 019-3 5 5 0 019 3c0 4.5-4 8-9 12z",
  "M3 12h4l3 8 4-16 3 8h4",
];

function defaultContent(){
  return {
    hero: {
      eyebrow: "Hand-decanted · Nationwide delivery",
      headlineBefore: "Find Your",
      headlineEm: "Signature",
      headlineAfter: "Scent",
      lede: "Discover authentic fragrance decants before committing to a full bottle — over {count} fragrances from {brands} houses, poured fresh and shipped nationwide.",
    },
    buildBand: {
      eyebrow: "A private consultation",
      heading: "Build My Collection",
      paragraph: "Answer a few questions about your lifestyle, climate, personality, and budget — we'll curate a personal fragrance wardrobe of decants suited to how you actually live, not just what's trending.",
    },
    brandsSection: {
      eyebrow: "21 houses, one destination",
      heading: "Explore Brands",
      paragraph: "From Emirati oud houses to iconic Parisian ateliers — browse by the names you already love.",
    },
    whySection: {
      eyebrow: "The case for decants",
      heading: "Why Sample First",
      paragraph: "A full bottle is a commitment. A decant is a conversation with a scent before you fall in love.",
      cards: [
        {title:"Avoid Expensive Blind Buys", desc:"Test the real thing on your own skin before spending on a full 50–100ml bottle."},
        {title:"Experience Before Committing", desc:"Notes read differently on paper than on skin. Live with a scent for days, not seconds."},
        {title:"Authentic, Hand-Decanted", desc:"Every decant is poured by hand from authentic, verified bottles — never diluted, never fake."},
        {title:"Affordable Exploration", desc:"Build a rotation of five fragrances for the price most people pay for one full bottle."},
      ],
    },
    testimonials: [
      {photo:null, name:"Marga, Quezon City", rating:5, text:"Finally a way to try Khamrah and Hawas without buying two full bottles I might not even like. Shipping was quick too."},
      {photo:null, name:"Jerome, Cebu", rating:5, text:"The Build My Collection questionnaire actually understood what I wanted. Got matched with three scents I now wear on rotation."},
      {photo:null, name:"Angeli, Davao", rating:5, text:"Decants arrived carefully packed, labeled clearly, and smelled exactly like the reviews said. My go-to for discovering new houses."},
    ],
    about: {
      photo: null,
      heading: "A boutique built for the undecided",
      paragraph: "Decant Dynasty started from a simple frustration: full bottles are expensive, blind buys rarely pay off, and the fragrance world is far too interesting to explore one gamble at a time. We hand-decant authentic bottles from {brands} houses so you can live with a scent for days before deciding it deserves a permanent place on your shelf.",
    },
    contact: {
      eyebrow: "Get in touch",
      heading: "Contact Us",
      paragraph: "Questions about a fragrance, an order, or a custom collection? Send us a message — we typically reply within a day.",
    },
  };
}
function fillTemplate(str){
  return String(str||"").replace("{count}", PRODUCTS.length).replace("{brands}", BRANDS.length);
}

/* ---------------- utils ---------------- */
function peso(n){ return "₱" + Number(n).toLocaleString("en-PH",{minimumFractionDigits:0}); }
function toast(msg){
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._h);
  t._h = setTimeout(()=>t.classList.remove("show"), 2600);
}
function esc(s){ return String(s??"").replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function slug(s){ return String(s).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,""); }

function getBrand(id){
  const base = BRANDS.find(b=>b.id===id);
  if(!base) return null;
  const ov = state.brandOverrides[id] || {};
  return {...base, ...ov};
}
function allBrands(){ return BRANDS.map(b=>getBrand(b.id)); }
function brandProductCount(id){ return PRODUCTS.filter(p=>p.brandId===id).length; }

function getProduct(id){
  const base = PRODUCTS.find(p=>p.id===id);
  if(!base) return null;
  const ov = state.overrides[id] || {};
  return {...base, ...ov, prices:{...base.prices, ...(ov.prices||{})}};
}
function allProducts(){ return PRODUCTS.map(p=>getProduct(p.id)); }
function productsByBrand(brandId){ return allProducts().filter(p=>p.brandId===brandId); }

function imgTag(src, alt, cls, fallbackText){
  const safeAlt = esc(alt);
  return `<img src="${esc(src)}" alt="${safeAlt}" class="${cls||''}"
    onerror="this.onerror=null;this.outerHTML='<div class=&quot;ph&quot;>${esc(fallbackText||alt)}</div>'" loading="lazy" />`;
}

/* ---------------- persistence bootstrap ---------------- */
async function loadPersisted(){
  const theme = await storeGet("prefs:theme", false);
  if(theme) state.theme = theme;
  document.documentElement.setAttribute("data-theme", state.theme);

  const cart = await storeGet("cart:v1", false);
  if(cart) { try{ state.cart = JSON.parse(cart); }catch(e){} }

  const wish = await storeGet("wishlist:v1", false);
  if(wish) { try{ state.wishlist = JSON.parse(wish); }catch(e){} }

  state.content = defaultContent();
  updateBadges();
}

function persistCart(){ storeSet("cart:v1", JSON.stringify(state.cart), false); }
function persistWishlist(){ storeSet("wishlist:v1", JSON.stringify(state.wishlist), false); }
function persistTheme(){ storeSet("prefs:theme", state.theme, false); }

/* ---------------- cart / wishlist logic ---------------- */
function addToCart(productId, size, qty){
  qty = qty || 1;
  const existing = state.cart.find(c=>c.productId===productId && c.size===size);
  if(existing) existing.qty += qty;
  else state.cart.push({productId, size, qty});
  persistCart(); updateBadges(); renderCartPanel(); toast("Added to your bag");
}
function removeFromCart(idx){ state.cart.splice(idx,1); persistCart(); updateBadges(); renderCartPanel(); }
function changeQty(idx, delta){
  state.cart[idx].qty = Math.max(1, state.cart[idx].qty+delta);
  persistCart(); updateBadges(); renderCartPanel();
}
function cartTotal(){
  return state.cart.reduce((sum,c)=>{
    const p = getProduct(c.productId); if(!p) return sum;
    return sum + (p.prices[c.size]||0)*c.qty;
  },0);
}
function toggleWishlist(productId){
  const i = state.wishlist.indexOf(productId);
  if(i>-1) state.wishlist.splice(i,1); else state.wishlist.push(productId);
  persistWishlist(); updateBadges(); renderWishPanel();
  document.querySelectorAll(`[data-wish-toggle="${productId}"]`).forEach(el=>el.classList.toggle("active", state.wishlist.includes(productId)));
}
function updateBadges(){
  const cartCount = state.cart.reduce((s,c)=>s+c.qty,0);
  const cb = document.getElementById("cartBadge");
  cb.textContent = cartCount; cb.classList.toggle("hidden", cartCount===0);
  const wb = document.getElementById("wishBadge");
  wb.textContent = state.wishlist.length; wb.classList.toggle("hidden", state.wishlist.length===0);
}

/* ---------------- Messenger checkout ---------------- */
function genRef(){ return "DD-" + Date.now().toString(36).toUpperCase().slice(-6); }
function buildOrderMessage(){
  const ref = genRef();
  let lines = [`Hi Decant Dynasty! I'd like to order:`, ``];
  state.cart.forEach(c=>{
    const p = getProduct(c.productId);
    if(!p) return;
    lines.push(`• ${p.brand} ${p.name} — ${c.size} x${c.qty} — ${peso((p.prices[c.size]||0)*c.qty)}`);
  });
  lines.push(``);
  lines.push(`Total: ${peso(cartTotal())}`);
  lines.push(`Order Reference: ${ref}`);
  lines.push(``);
  lines.push(`Name: `);
  lines.push(`Contact Number: `);
  lines.push(`Delivery Address: `);
  lines.push(``);
  lines.push(`HOW TO ORDER?`);
  lines.push(`1. Ask our admin for the payment details.`);
  lines.push(`2. Kindly wait for our admin to send your invoice.`);
  lines.push(`3. Settle your payment and send your proof of payment.`);
  lines.push(`4. Once confirmed we will process your order.`);
  lines.push(`We ship nationwide via J&T Express. You may also book Lalamove for same-day delivery.`);
  lines.push(`Don't forget to share your experience with us once your order arrives!`);
  lines.push(``);
  lines.push(`Please note: we do not accept Cash On Delivery (COD), and shipping fee is shouldered by the buyer.`);
  return {ref, text: lines.join("\n")};
}
function openCheckout(){
  if(state.cart.length===0){ toast("Your bag is empty"); return; }
  const {text} = buildOrderMessage();
  navigator.clipboard?.writeText(text).catch(()=>{});
  showCheckoutModal(text);
}
function showCheckoutModal(text){
  const backdrop = document.getElementById("qvBackdrop");
  const modal = document.getElementById("qvModal");
  modal.innerHTML = `
    <button class="modal-close" data-close-modal>&times;</button>
    <div style="padding:40px;">
      <div class="eyebrow" style="margin-bottom:14px;">Almost there</div>
      <h2 style="font-family:var(--font-display);font-weight:400;margin:0 0 14px;font-size:28px;">Send your order on Messenger</h2>
      <p style="color:var(--ink-soft);font-size:14.5px;line-height:1.7;margin-bottom:18px;">
        We've copied your order summary to your clipboard. Tap <b>Open Messenger</b>, then paste it into
        the chat with us so our admin can send you payment details and an invoice.
      </p>
      <div class="copy-box" id="checkoutText">${esc(text)}</div>
      <div style="display:flex;gap:12px;margin-top:22px;flex-wrap:wrap;">
        <a class="btn btn-primary" href="https://m.me/decantdynasty" target="_blank" rel="noopener">Open Messenger</a>
        <button class="btn btn-ghost" id="copyAgainBtn">Copy Message Again</button>
      </div>
    </div>`;
  backdrop.classList.add("open"); modal.classList.add("open");
  document.getElementById("copyAgainBtn").onclick = ()=>{
    navigator.clipboard?.writeText(text); toast("Copied to clipboard");
  };
}

/* ---------------- scroll reveal ---------------- */
let revealObserver;
function initReveal(root){
  revealObserver && revealObserver.disconnect();
  revealObserver = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add("in"); revealObserver.unobserve(e.target); } });
  }, {threshold:.14});
  (root||document).querySelectorAll(".reveal, .stagger").forEach(el=>revealObserver.observe(el));
}

/* ================================================================
   RENDER: HOME
   ================================================================ */
function heroArtSVG(){
  // restrained line-art bottle + leaf motif — a quiet signature instead of a mascot
  return `<svg viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="70" y="70" width="60" height="130" rx="14" style="stroke:var(--ink)" stroke-width="2"/>
    <rect x="86" y="40" width="28" height="34" rx="6" style="stroke:var(--ink)" stroke-width="2"/>
    <rect x="92" y="24" width="16" height="20" rx="3" style="stroke:var(--gold)" stroke-width="2"/>
    <line x1="70" y1="120" x2="130" y2="120" style="stroke:var(--line)" stroke-width="1.5"/>
    <path d="M40 150 C 20 130, 20 100, 45 90" style="stroke:var(--green)" stroke-width="2" stroke-linecap="round"/>
    <path d="M160 160 C 182 145, 182 115, 158 100" style="stroke:var(--green)" stroke-width="2" stroke-linecap="round"/>
    <circle cx="100" cy="150" r="1.6" style="fill:var(--gold)"/>
    <circle cx="100" cy="164" r="1.6" style="fill:var(--gold)"/>
    <circle cx="100" cy="178" r="1.6" style="fill:var(--gold)"/>
  </svg>`;
}

function renderHome(){
  const arrivals = allProducts().slice(-8).reverse().slice(0,4);
  const brands = allBrands().slice(0,8);
  const c = state.content;
  return `
  <section class="hero">
    <div class="wrap hero-grid">
      <div>
        <div class="eyebrow">${esc(c.hero.eyebrow)}</div>
        <h1>${esc(c.hero.headlineBefore)} <em>${esc(c.hero.headlineEm)}</em><br/>${esc(c.hero.headlineAfter)}</h1>
        <p class="lede">${esc(fillTemplate(c.hero.lede))}</p>
        <div class="hero-actions">
          <a href="#/collection" class="btn btn-cta btn-cta-build">Shop Decants</a>
          <a href="#/build" class="btn btn-cta btn-cta-browse">Build My Collection</a>
        </div>
      </div>
      <div class="hero-art" id="heroBottleContainer"></div>
    </div>
  </section>

  <section>
    <div class="wrap">
      <div class="section-head reveal">
        <div class="eyebrow">${esc(c.brandsSection.eyebrow)}</div>
        <h2>${esc(c.brandsSection.heading)}</h2>
        <p>${esc(c.brandsSection.paragraph)}</p>
      </div>
      <div class="brand-grid stagger">
        ${brands.map(brandCardHTML).join("")}
      </div>
      <div style="text-align:center;margin-top:48px;">
        <a href="#/brands" class="btn btn-ghost">View All Brands</a>
      </div>
    </div>
  </section>

  <section>
    <div class="wrap">
      <div class="section-head reveal">
        <div class="eyebrow">Just poured</div>
        <h2>New Arrivals</h2>
      </div>
      <div class="product-grid stagger">${arrivals.map(productCardHTML).join("")}</div>
    </div>
  </section>

  <section>
    <div class="wrap">
      <div class="section-head reveal">
        <div class="eyebrow">${esc(c.whySection.eyebrow)}</div>
        <h2>${esc(c.whySection.heading)}</h2>
        <p>${esc(c.whySection.paragraph)}</p>
      </div>
      <div class="why-grid stagger">
        ${c.whySection.cards.map((card,i)=>whyCard(WHY_ICONS[i%WHY_ICONS.length], card.title, card.desc)).join("")}
      </div>
    </div>
  </section>
  `;
}
function whyCard(path, title, body){
  return `<div class="why-card"><div class="why-icon"><svg viewBox="0 0 24 24"><path d="${path}"/></svg></div><h3>${esc(title)}</h3><p>${esc(body)}</p></div>`;
}
function testiCard(t){
  const stars = "★".repeat(Math.max(0,Math.min(5,t.rating||5))) + "☆".repeat(5-Math.max(0,Math.min(5,t.rating||5)));
  return `<div class="testi-card">
    <div class="testi-stars">${stars}</div>
    <p>"${esc(t.text)}"</p>
    <div style="display:flex;align-items:center;gap:10px;">
      <div class="testi-avatar">${t.photo ? `<img src="${esc(t.photo)}" alt="${esc(t.name)}"/>` : `<span>${esc((t.name||"?")[0])}</span>`}</div>
      <div class="testi-name">${esc(t.name)}</div>
    </div>
  </div>`;
}

/* ================================================================
   RENDER: BRAND CARD / PRODUCT CARD (reused everywhere)
   ================================================================ */
function brandCardHTML(b){
  const count = brandProductCount(b.id);
  return `<div class="brand-card" data-go="/brand/${b.id}">
    <div class="brand-arrow"><svg viewBox="0 0 24 24" stroke="var(--ink)" fill="none" stroke-width="1.6"><line x1="5" y1="19" x2="19" y2="5"/><polyline points="9 5 19 5 19 15"/></svg></div>
    <div class="brand-logo-wrap">
      ${b.logo ? imgTag(b.logo, b.name, "", b.name[0]) : `<span class="fallback">${esc(b.name[0])}</span>`}
    </div>
    <div class="brand-name">${esc(b.name)}</div>
    <div class="brand-count">${count} fragrance${count===1?"":"s"}</div>
    <div class="brand-desc">Tap to explore the full ${esc(b.name)} decant range.</div>
  </div>`;
}
function productCardHTML(p){
  const isWish = state.wishlist.includes(p.id);
  const sizes = Object.keys(p.prices);
  return `<div class="product-card" data-go="/product/${p.id}">
    ${p.recommended ? `<div class="badge-rec">Best Seller</div>` : ""}
    <div class="product-media">
      ${imgTag(p.image, `${p.brand} ${p.name}`, "", `${p.brand} — ${p.name}`)}
      <button class="wish-toggle ${isWish?'active':''}" data-wish-toggle="${p.id}" data-stop aria-label="Wishlist">
        <svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.7-10-9.3C.5 8.2 2.4 5 6 5c2 0 3.4 1 4.5 2.4l1.5 1.9 1.5-1.9C14.6 6 16 5 18 5c3.6 0 5.5 3.2 4 6.7C19.5 16.3 12 21 12 21z"/></svg>
      </button>
      <button class="quick-view-btn" data-quickview="${p.id}" data-stop>Quick View</button>
    </div>
    <div class="product-body">
      <div class="product-brand">${esc(p.brand)}</div>
      <div class="product-name">${esc(p.name)}</div>
      <div class="product-meta-row">
        <div class="product-price">${peso(Math.min(...Object.values(p.prices)))} <small>from</small></div>
        <div class="size-dots">${sizes.map(()=>`<span></span>`).join("")}</div>
      </div>
    </div>
  </div>`;
}

/* ================================================================
   RENDER: BRANDS INDEX
   ================================================================ */
function renderBrandsIndex(){
  return `
  <div class="page-header wrap">
    <div class="breadcrumb"><a href="#/">Home</a> / Brands</div>
    <h1>All Brands</h1>
    <p>${BRANDS.length} houses, ${PRODUCTS.length} fragrances and counting — new arrivals added regularly.</p>
  </div>
  <section style="padding-top:0;">
    <div class="wrap">
      <div class="brand-grid stagger in">${allBrands().map(brandCardHTML).join("")}</div>
    </div>
  </section>`;
}

/* ================================================================
   RENDER: BRAND DETAIL (product listing per brand)
   ================================================================ */
function renderBrandDetail(brandId){
  const brand = getBrand(brandId);
  if(!brand) return `<div class="center-empty">Brand not found. <a href="#/brands">Back to brands</a></div>`;
  const products = productsByBrand(brandId);
  return `
  <div class="page-header wrap">
    <div class="breadcrumb"><a href="#/">Home</a> / <a href="#/brands">Brands</a> / ${esc(brand.name)}</div>
    <div class="brand-header">
      <div class="logo">${brand.logo ? imgTag(brand.logo, brand.name, "", brand.name[0]) : brand.name[0]}</div>
      <div>
        <h1 style="margin-bottom:6px;">${esc(brand.name)}</h1>
        <p style="margin:0;">${products.length} fragrance${products.length===1?"":"s"} available as decants</p>
      </div>
    </div>
  </div>
  <section style="padding-top:0;">
    <div class="wrap">
      <div class="grid-toolbar">
        <div class="chip-row">
          <button class="chip active" data-filter-gender="all">All</button>
          <button class="chip" data-filter-gender="Men">Men</button>
          <button class="chip" data-filter-gender="Women">Women</button>
          <button class="chip" data-filter-gender="Unisex">Unisex</button>
        </div>
      </div>
      <div class="product-grid stagger in" id="brandProductGrid">${products.map(productCardHTML).join("")}</div>
    </div>
  </section>`;
}

/* ================================================================
   RENDER: COLLECTION (all products, filterable)
   ================================================================ */
function renderCollection(){
  const products = allProducts();
  const brandOptions = allBrands();
  return `
  <div class="page-header wrap">
    <div class="breadcrumb"><a href="#/">Home</a> / Collection</div>
    <h1>The Full Collection</h1>
    <p>${products.length} fragrances across ${BRANDS.length} houses — filter by gender or brand to find your next decant.</p>
  </div>
  <section style="padding-top:0;">
    <div class="wrap">
      <div class="grid-toolbar">
        <div class="chip-row" id="genderChips">
          <button class="chip active" data-cf-gender="all">All</button>
          <button class="chip" data-cf-gender="Men">Men</button>
          <button class="chip" data-cf-gender="Women">Women</button>
          <button class="chip" data-cf-gender="Unisex">Unisex</button>
        </div>
        <select class="mini-input" id="brandFilterSelect" style="max-width:220px;">
          <option value="all">All Brands</option>
          ${brandOptions.map(b=>`<option value="${b.id}">${esc(b.name)}</option>`).join("")}
        </select>
      </div>
      <div class="product-grid stagger in" id="collectionGrid">${products.map(productCardHTML).join("")}</div>
    </div>
  </section>`;
}

/* ================================================================
   RENDER: PRODUCT DETAIL
   ================================================================ */
function notesPyramid(p){
  const row = (lbl, arr) => arr && arr.length ? `<div class="notes-row"><div class="lbl">${lbl}</div><div class="notes-tags">${arr.map(n=>`<span class="note-tag">${esc(n)}</span>`).join("")}</div></div>` : "";
  return `<div class="notes-pyramid">${row("Top",p.topNotes)}${row("Heart",p.heartNotes)}${row("Base",p.baseNotes)}</div>`;
}
function sizeSelectHTML(p, selected){
  return Object.entries(p.prices).map(([size,price])=>
    `<button class="size-opt ${size===selected?'active':''}" data-size-opt="${size}">${size}<b>${peso(price)}</b></button>`
  ).join("");
}
function renderProductDetail(productId){
  const p = getProduct(productId);
  if(!p) return `<div class="center-empty">Fragrance not found. <a href="#/collection">Back to collection</a></div>`;
  const firstSize = Object.keys(p.prices)[0];
  const hasImage2 = !!(state.overrides[p.id] && state.overrides[p.id].image2);
  return `
  <div class="wrap pd-grid" id="pdWrap" data-pid="${p.id}" data-size="${firstSize}">
    <div>
      <div class="pd-media">${imgTag(p.image, `${p.brand} ${p.name}`, "", `${p.brand} — ${p.name}`)}</div>
      ${hasImage2 ? `<div class="pd-media pd-media-2">${imgTag(p.image2, `${p.brand} ${p.name} decant bottle`, "", "Decant bottle")}</div>` : ""}
    </div>
    <div>
      <div class="breadcrumb"><a href="#/">Home</a> / <a href="#/brand/${p.brandId}">${esc(p.brand)}</a> / ${esc(p.name)}</div>
      <div class="pd-brand">${esc(p.brand)}</div>
      <h1 class="pd-name">${esc(p.name)}</h1>
      <div class="pd-facts">
        <div class="pd-fact">Concentration<b>${esc(p.concentration)}</b></div>
        <div class="pd-fact">Gender<b>${esc(p.gender)}</b></div>
        <div class="pd-fact">Longevity<b>${esc(p.longevity)}</b></div>
        <div class="pd-fact">Projection<b>${esc(p.projection)}</b></div>
      </div>
      <p class="pd-desc">${esc(p.description)}</p>
      ${notesPyramid(p)}
      <div class="eyebrow" style="margin-bottom:12px;">Choose Size</div>
      <div class="size-select" id="sizeSelectWrap">${sizeSelectHTML(p, firstSize)}</div>
      <div class="pd-actions">
        <button class="btn btn-primary" id="pdAddToCart">Add to Bag</button>
        <button class="btn btn-ghost" id="pdWishBtn" data-wish-toggle="${p.id}">${state.wishlist.includes(p.id) ? "♥ In Wishlist" : "♡ Add to Wishlist"}</button>
      </div>
      ${!p.verified ? `<div class="unverified-note">Note pyramid pending final Fragrantica cross-check — verified via our sourcing team before shipping. Ask our admin on Messenger for confirmation.</div>` : ""}
    </div>
  </div>
  <section>
    <div class="wrap">
      <div class="section-head reveal"><div class="eyebrow">You may also like</div><h2>More from ${esc(p.brand)}</h2></div>
      <div class="product-grid stagger">${productsByBrand(p.brandId).filter(x=>x.id!==p.id).slice(0,4).map(productCardHTML).join("")}</div>
    </div>
  </section>
  `;
}

/* ================================================================
   RENDER: QUICK VIEW MODAL
   ================================================================ */
function openQuickView(productId){
  const p = getProduct(productId);
  if(!p) return;
  const firstSize = Object.keys(p.prices)[0];
  const modal = document.getElementById("qvModal");
  modal.innerHTML = `
    <button class="modal-close" data-close-modal>&times;</button>
    <div class="modal-inner" data-pid="${p.id}" data-size="${firstSize}">
      <div class="modal-media">${imgTag(p.image, `${p.brand} ${p.name}`, "", `${p.brand} — ${p.name}`)}</div>
      <div class="modal-body">
        <div class="pd-brand">${esc(p.brand)}</div>
        <h2 class="pd-name" style="font-size:26px;">${esc(p.name)}</h2>
        <p class="pd-desc" style="font-size:13.5px;">${esc(p.description)}</p>
        ${notesPyramid(p)}
        <div class="eyebrow" style="margin-bottom:10px;">Choose Size</div>
        <div class="size-select" id="qvSizeWrap">${sizeSelectHTML(p, firstSize)}</div>
        <div class="pd-actions">
          <button class="btn btn-primary" id="qvAddToCart">Add to Bag</button>
          <a class="btn btn-ghost" href="#/product/${p.id}">Full Details</a>
        </div>
      </div>
    </div>`;
  document.getElementById("qvBackdrop").classList.add("open");
  modal.classList.add("open");
}
function closeModal(){
  document.getElementById("qvBackdrop").classList.remove("open");
  document.getElementById("qvModal").classList.remove("open");
}

/* ================================================================
   RENDER: BUILD MY COLLECTION (consultation quiz)
   ================================================================ */
const QUIZ = [
  {key:"lifestyle", q:"What does most of your week look like?", opts:["Office & meetings","Creative & casual","Active & outdoorsy","Nights out & social"]},
  {key:"climate", q:"What climate do you wear scent in most?", opts:["Hot & humid","Warm, occasional rain","Cool evenings","It varies a lot"]},
  {key:"personality", q:"Which word feels most like you?", opts:["Confident","Romantic","Understated","Adventurous"]},
  {key:"budget", q:"What's a comfortable decant budget to start?", opts:["Under ₱300","₱300–₱700","₱700–₱1,500","No limit — I want the full experience"]},
];
let quizAnswers = {};
let quizStep = 0;
function pickForAnswers(){
  const genderGuess = quizAnswers.personality==="Romantic" ? "Women" : (quizAnswers.personality==="Adventurous"?"Unisex":"Men");
  let pool = allProducts().filter(p=>p.gender===genderGuess || p.gender==="Unisex");
  if(pool.length<6) pool = allProducts();
  const recommended = pool.filter(p=>p.recommended);
  const chosen = (recommended.length>=3 ? recommended : pool).slice(0,4);
  return chosen;
}
function renderBuild(){
  return `
  <div class="page-header wrap">
    <div class="breadcrumb"><a href="#/">Home</a> / Build My Collection</div>
    <h1>Build My Collection</h1>
    <p>A private consultation, not a quiz for a quiz's sake. Answer a few questions about your lifestyle, the climate you wear scent in, the personality you want to express, and your budget — we'll curate a personal fragrance wardrobe of decants suited to you.</p>
  </div>
  <section style="padding-top:0;">
    <div class="wrap" style="max-width:640px;">
      <div class="collection-card" style="background:var(--card);border:1px solid var(--line);color:var(--ink);" id="quizCard"></div>
    </div>
  </section>`;
}
function renderQuizStep(){
  const card = document.getElementById("quizCard");
  if(!card) return;
  if(quizStep >= QUIZ.length){
    const picks = pickForAnswers();
    card.innerHTML = `
      <span class="tag">Your Curated Wardrobe</span>
      <h3 class="quiz-q">A collection matched to how you live</h3>
      <p style="color:var(--ink-soft);font-size:14px;margin-bottom:22px;">Based on your answers, here's where we'd start — each available as a decant so you can try before you commit.</p>
      <div class="product-grid" style="grid-template-columns:repeat(2,1fr);">${picks.map(productCardHTML).join("")}</div>
      <div style="margin-top:24px;"><button class="btn btn-ghost btn-sm" id="quizRestart">Start Over</button></div>
    `;
    card.querySelectorAll("[data-go]").forEach(bindCardNav);
    card.querySelectorAll("[data-wish-toggle]").forEach(bindWishButton);
    card.querySelectorAll("[data-quickview]").forEach(bindQuickviewButton);
    document.getElementById("quizRestart").onclick = ()=>{ quizStep=0; quizAnswers={}; renderQuizStep(); };
    initReveal(card);
    return;
  }
  const step = QUIZ[quizStep];
  card.innerHTML = `
    <div class="quiz-progress">${QUIZ.map((_,i)=>`<span><i style="width:${i<quizStep?100:(i===quizStep?50:0)}%"></i></span>`).join("")}</div>
    <div class="quiz-q">${esc(step.q)}</div>
    <div class="quiz-opts">${step.opts.map(o=>`<button class="quiz-opt" data-answer="${esc(o)}">${esc(o)}</button>`).join("")}</div>
  `;
  card.querySelectorAll("[data-answer]").forEach(btn=>{
    btn.onclick = ()=>{ quizAnswers[step.key]=btn.dataset.answer; quizStep++; renderQuizStep(); };
  });
}

/* ================================================================
   RENDER: ABOUT / CONTACT
   ================================================================ */
function renderAbout(){
  const a = state.content.about;
  return `
  <div class="simple-page">
    <div class="wrap">
      <div class="about-hero reveal">
        <div class="eyebrow" style="justify-content:center;">Our Story</div>
        <h1 style="font-family:var(--font-display);font-weight:400;font-size:clamp(30px,4.6vw,48px);">${esc(a.heading)}</h1>
        <p style="color:var(--ink-soft);font-size:16px;line-height:1.8;margin-top:18px;">
          ${esc(fillTemplate(a.paragraph))}
        </p>
      </div>
      ${a.photo ? `<div class="reveal" style="max-width:560px;margin:0 auto 60px;border-radius:28px;overflow:hidden;box-shadow:var(--shadow-lift);"><img src="${esc(a.photo)}" alt="How it all started" style="width:100%;display:block;"/></div>` : ""}
      <div class="value-grid stagger">
        ${whyCard("M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z","Authenticity First","Every decant is poured by hand from verified, authentic bottles.")}
        ${whyCard("M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z","Curated, Not Cluttered","We add fragrances deliberately, researched down to the note pyramid.")}
        ${whyCard("M3 12h4l3 8 4-16 3 8h4","Made for Explorers","Whether you're new to fragrance or chasing your hundredth bottle, there's a decant-sized way in.")}
      </div>
    </div>
  </div>`;
}
function renderContact(){
  const c = state.content.contact;
  return `
  <div class="simple-page">
    <div class="wrap narrow">
      <div class="section-head reveal" style="text-align:left;margin-bottom:36px;">
        <div class="eyebrow">${esc(c.eyebrow)}</div>
        <h2>${esc(c.heading)}</h2>
        <p>${esc(c.paragraph)}</p>
      </div>
      <form id="contactForm">
        <div class="form-row"><label>Name</label><input required placeholder="Your full name"/></div>
        <div class="form-row"><label>Email or Facebook Name</label><input required placeholder="So we can reach you back"/></div>
        <div class="form-row"><label>Message</label><textarea required rows="5" placeholder="Tell us what you're looking for…"></textarea></div>
        <button class="btn btn-primary" type="submit">Send Message</button>
      </form>
      <p style="margin-top:26px;color:var(--ink-soft);font-size:13.5px;">Prefer Messenger? Reach us directly at <a href="https://m.me/decantdynasty" target="_blank" style="color:var(--green);text-decoration:underline;">m.me/decantdynasty</a>.</p>
    </div>
  </div>`;
}

/* ================================================================
   RENDER: WISHLIST / CART PANELS
   ================================================================ */
function renderWishPanel(){
  const body = document.getElementById("wishBody");
  const items = state.wishlist.map(getProduct).filter(Boolean);
  if(items.length===0){
    body.innerHTML = `<div class="empty-state"><svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.7-10-9.3C.5 8.2 2.4 5 6 5c2 0 3.4 1 4.5 2.4l1.5 1.9 1.5-1.9C14.6 6 16 5 18 5c3.6 0 5.5 3.2 4 6.7C19.5 16.3 12 21 12 21z"/></svg><div>Your wishlist is empty.</div></div>`;
    return;
  }
  body.innerHTML = items.map(p=>`
    <div class="cart-item">
      ${imgTag(p.image, p.name, "", p.name)}
      <div style="flex:1;">
        <div class="ci-name">${esc(p.brand)} — ${esc(p.name)}</div>
        <div class="ci-meta">${peso(Math.min(...Object.values(p.prices)))} from</div>
        <div style="display:flex;gap:10px;">
          <button class="btn btn-sm btn-ghost" data-wish-add-cart="${p.id}">Add to Bag</button>
          <button class="remove-x" data-wish-toggle="${p.id}">Remove</button>
        </div>
      </div>
    </div>
  `).join("");
  body.querySelectorAll("[data-wish-add-cart]").forEach(btn=>{
    btn.onclick = ()=>{ const p=getProduct(btn.dataset.wishAddCart); addToCart(p.id, Object.keys(p.prices)[0], 1); };
  });
  body.querySelectorAll("[data-wish-toggle]").forEach(bindWishButton);
}
function renderCartPanel(){
  const body = document.getElementById("cartBody");
  const foot = document.getElementById("cartFoot");
  if(state.cart.length===0){
    body.innerHTML = `<div class="empty-state"><svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.5 3h2l2.4 12.4a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L21.5 7H6"/></svg><div>Your bag is empty.</div></div>`;
    foot.innerHTML = "";
    return;
  }
  body.innerHTML = state.cart.map((c,idx)=>{
    const p = getProduct(c.productId); if(!p) return "";
    return `<div class="cart-item">
      ${imgTag(p.image, p.name, "", p.name)}
      <div style="flex:1;">
        <div class="ci-name">${esc(p.brand)} — ${esc(p.name)}</div>
        <div class="ci-meta">${c.size} · ${peso(p.prices[c.size]||0)}</div>
        <div class="qty-row">
          <button data-qty-minus="${idx}">−</button>
          <span>${c.qty}</span>
          <button data-qty-plus="${idx}">+</button>
          <button class="remove-x" data-cart-remove="${idx}">Remove</button>
        </div>
      </div>
    </div>`;
  }).join("");
  foot.innerHTML = `
    <div class="subtotal-row"><span>Subtotal</span><span>${peso(cartTotal())}</span></div>
    <button class="btn btn-primary" style="width:100%;" id="checkoutBtn">Checkout via Messenger</button>
    <p style="font-size:11.5px;color:var(--ink-soft);margin-top:10px;text-align:center;">Shipping fee shouldered by buyer · No COD</p>
  `;
  body.querySelectorAll("[data-qty-minus]").forEach(b=>b.onclick=()=>changeQty(+b.dataset.qtyMinus,-1));
  body.querySelectorAll("[data-qty-plus]").forEach(b=>b.onclick=()=>changeQty(+b.dataset.qtyPlus,1));
  body.querySelectorAll("[data-cart-remove]").forEach(b=>b.onclick=()=>removeFromCart(+b.dataset.cartRemove));
  document.getElementById("checkoutBtn").onclick = openCheckout;
}

/* ================================================================
   ROUTER
   ================================================================ */
function parseHash(){
  const h = location.hash.replace(/^#\/?/, "");
  const parts = h.split("/").filter(Boolean);
  if(parts.length===0) return {page:"home"};
  if(parts[0]==="brand" && parts[1]) return {page:"brand", id:parts[1]};
  if(parts[0]==="product" && parts[1]) return {page:"product", id:parts[1]};
  if(["collection","brands","build","about","contact"].includes(parts[0])) return {page:parts[0]};
  return {page:"home"};
}
async function route(){
  closeAllPanels();
  const r = parseHash();
  state.route = r;
  const app = document.getElementById("app");
  window.scrollTo({top:0,behavior:"instant" in window ? "instant":"auto"});
  document.querySelectorAll(".nav-links a").forEach(a=>a.classList.toggle("active", a.dataset.nav === "/"+ (r.page==="home"?"":r.page)));

  let html = "";
  if(r.page==="home") html = renderHome();
  else if(r.page==="brands") html = renderBrandsIndex();
  else if(r.page==="brand") html = renderBrandDetail(r.id);
  else if(r.page==="product") html = renderProductDetail(r.id);
  else if(r.page==="collection") html = renderCollection();
  else if(r.page==="build") html = renderBuild();
  else if(r.page==="about") html = renderAbout();
  else if(r.page==="contact") html = renderContact();
  else html = renderHome();

  app.innerHTML = html;
  postRenderBind(r);
  initReveal(app);
}

function bindCardNav(el){
  el.addEventListener("click",(e)=>{
    if(e.target.closest("[data-stop]")) return;
    const go = el.dataset.go;
    if(go) location.hash = "#"+go;
  });
}
function bindWishButton(el){
  el.onclick = (e)=>{ e.stopPropagation(); toggleWishlist(el.dataset.wishToggle);
    if(el.classList.contains("btn")) el.textContent = state.wishlist.includes(el.dataset.wishToggle) ? "♥ In Wishlist" : "♡ Add to Wishlist";
  };
}
function bindQuickviewButton(el){
  el.onclick = (e)=>{ e.stopPropagation(); openQuickView(el.dataset.quickview); };
}

function postRenderBind(r){
  document.querySelectorAll("[data-go]").forEach(bindCardNav);
  document.querySelectorAll("[data-wish-toggle]").forEach(bindWishButton);
  document.querySelectorAll("[data-quickview]").forEach(bindQuickviewButton);

  if(r.page==="product"){
    const wrap = document.getElementById("pdWrap");
    wrap.querySelectorAll("[data-size-opt]").forEach(btn=>{
      btn.onclick = ()=>{ wrap.querySelectorAll("[data-size-opt]").forEach(b=>b.classList.remove("active")); btn.classList.add("active"); wrap.dataset.size = btn.dataset.sizeOpt; };
    });
    document.getElementById("pdAddToCart").onclick = ()=>{ addToCart(wrap.dataset.pid, wrap.dataset.size, 1); };
  }
  if(r.page==="brand"){
    const grid = document.getElementById("brandProductGrid");
    document.querySelectorAll("[data-filter-gender]").forEach(chip=>{
      chip.onclick = ()=>{
        document.querySelectorAll("[data-filter-gender]").forEach(c=>c.classList.remove("active"));
        chip.classList.add("active");
        const g = chip.dataset.filterGender;
        const items = productsByBrand(r.id).filter(p=> g==="all" || p.gender===g);
        grid.innerHTML = items.map(productCardHTML).join("");
        grid.querySelectorAll("[data-go]").forEach(bindCardNav);
        grid.querySelectorAll("[data-wish-toggle]").forEach(bindWishButton);
        grid.querySelectorAll("[data-quickview]").forEach(bindQuickviewButton);
      };
    });
  }
  if(r.page==="collection"){
    const grid = document.getElementById("collectionGrid");
    let curGender = "all", curBrand="all";
    function apply(){
      const items = allProducts().filter(p=>(curGender==="all"||p.gender===curGender)&&(curBrand==="all"||p.brandId===curBrand));
      grid.innerHTML = items.length ? items.map(productCardHTML).join("") : `<div class="center-empty" style="grid-column:1/-1;">No fragrances match those filters yet.</div>`;
      grid.querySelectorAll("[data-go]").forEach(bindCardNav);
      grid.querySelectorAll("[data-wish-toggle]").forEach(bindWishButton);
      grid.querySelectorAll("[data-quickview]").forEach(bindQuickviewButton);
    }
    document.querySelectorAll("[data-cf-gender]").forEach(chip=>{
      chip.onclick = ()=>{ document.querySelectorAll("[data-cf-gender]").forEach(c=>c.classList.remove("active")); chip.classList.add("active"); curGender=chip.dataset.cfGender; apply(); };
    });
    document.getElementById("brandFilterSelect").onchange = (e)=>{ curBrand = e.target.value; apply(); };
  }
  if(r.page==="build"){ quizStep=0; quizAnswers={}; renderQuizStep(); }
  if(r.page==="contact"){
    document.getElementById("contactForm").addEventListener("submit",(e)=>{ e.preventDefault(); toast("Message sent — we'll reply soon!"); e.target.reset(); });
  }
}

/* ================================================================
   GLOBAL UI: navbar scroll, drawer, panels, theme, search
   ================================================================ */
function closeAllPanels(){
  ["searchBackdrop","searchPanel","wishBackdrop","wishPanel","cartBackdrop","cartPanel"].forEach(id=>{
    document.getElementById(id).classList.remove("open");
  });
  closeModal();
}
function initGlobalUI(){
  const navbar = document.getElementById("navbar");
  window.addEventListener("scroll", ()=>{ navbar.classList.toggle("scrolled", window.scrollY>10); }, {passive:true});

  document.getElementById("menuBtn").onclick = ()=>{ document.getElementById("drawer").classList.add("open"); document.getElementById("drawerBackdrop").classList.add("open"); };
  document.getElementById("drawerBackdrop").onclick = closeDrawer;
  document.querySelectorAll("[data-close-drawer]").forEach(a=>a.addEventListener("click",closeDrawer));
  function closeDrawer(){ document.getElementById("drawer").classList.remove("open"); document.getElementById("drawerBackdrop").classList.remove("open"); }

  document.getElementById("themeBtn").onclick = ()=>{
    state.theme = state.theme==="dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", state.theme);
    persistTheme();
  };

  // wishlist panel
  document.getElementById("wishlistBtn").onclick = ()=>{ renderWishPanel(); document.getElementById("wishBackdrop").classList.add("open"); document.getElementById("wishPanel").classList.add("open"); };
  document.getElementById("wishBackdrop").onclick = ()=>{ document.getElementById("wishBackdrop").classList.remove("open"); document.getElementById("wishPanel").classList.remove("open"); };
  document.querySelector("[data-close-wish]").onclick = ()=>{ document.getElementById("wishBackdrop").classList.remove("open"); document.getElementById("wishPanel").classList.remove("open"); };

  // cart panel
  document.getElementById("cartBtn").onclick = ()=>{ renderCartPanel(); document.getElementById("cartBackdrop").classList.add("open"); document.getElementById("cartPanel").classList.add("open"); };
  document.getElementById("cartBackdrop").onclick = ()=>{ document.getElementById("cartBackdrop").classList.remove("open"); document.getElementById("cartPanel").classList.remove("open"); };
  document.querySelector("[data-close-cart]").onclick = ()=>{ document.getElementById("cartBackdrop").classList.remove("open"); document.getElementById("cartPanel").classList.remove("open"); };

  // search panel
  document.getElementById("searchBtn").onclick = ()=>{
    document.getElementById("searchBackdrop").classList.add("open");
    document.getElementById("searchPanel").classList.add("open");
    document.getElementById("searchInput").value="";
    document.getElementById("searchResults").innerHTML = "";
    setTimeout(()=>document.getElementById("searchInput").focus(),300);
  };
  document.getElementById("searchBackdrop").onclick = ()=>{ document.getElementById("searchBackdrop").classList.remove("open"); document.getElementById("searchPanel").classList.remove("open"); };
  document.querySelector("[data-close-search]").onclick = ()=>{ document.getElementById("searchBackdrop").classList.remove("open"); document.getElementById("searchPanel").classList.remove("open"); };
  document.getElementById("searchInput").addEventListener("input",(e)=>{
    const q = e.target.value.trim().toLowerCase();
    const results = document.getElementById("searchResults");
    if(q.length<2){ results.innerHTML=""; return; }
    const matches = allProducts().filter(p=>p.name.toLowerCase().includes(q)||p.brand.toLowerCase().includes(q)).slice(0,20);
    results.innerHTML = matches.length ? matches.map(p=>`
      <div class="search-result" data-go-search="${p.id}">
        ${imgTag(p.image,p.name,"",p.name)}
        <div><div class="sr-name">${esc(p.name)}</div><div class="sr-brand">${esc(p.brand)}</div></div>
      </div>`).join("") : `<div style="color:var(--ink-soft);font-size:13.5px;padding:20px 0;">No matches yet — try a brand or fragrance name.</div>`;
    results.querySelectorAll("[data-go-search]").forEach(el=>{
      el.onclick = ()=>{ location.hash = "#/product/"+el.dataset.goSearch; document.getElementById("searchBackdrop").classList.remove("open"); document.getElementById("searchPanel").classList.remove("open"); };
    });
  });

  // quick view modal
  document.getElementById("qvBackdrop").onclick = closeModal;
  document.getElementById("qvModal").addEventListener("click",(e)=>{
    if(e.target.closest("[data-close-modal]")) closeModal();
    if(e.target.closest("[data-size-opt]")){
      const wrap = e.target.closest("[data-pid]");
      wrap.querySelectorAll("[data-size-opt]").forEach(b=>b.classList.remove("active"));
      e.target.closest("[data-size-opt]").classList.add("active");
      wrap.dataset.size = e.target.closest("[data-size-opt]").dataset.sizeOpt;
    }
    if(e.target.id==="qvAddToCart"){
      const wrap = document.querySelector("#qvModal [data-pid]");
      addToCart(wrap.dataset.pid, wrap.dataset.size, 1);
    }
  });

  window.addEventListener("hashchange", route);
}

/* ---------------- boot ---------------- */
(async function init(){
  await loadPersisted();
  initGlobalUI();
  route();
})();

})();
