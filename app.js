/* ============================================================
   DECANT DYNASTY — APPLICATION LOGIC
   Vanilla JS SPA. No build step required — drop into public/
   alongside data.js and it runs as-is.
   ============================================================ */
(function(){
"use strict";

/* ---------------- device-local preferences ---------------- */
function localGet(key){ try{return localStorage.getItem(key);}catch(e){return null;} }
function localSet(key,value){ try{localStorage.setItem(key,value);}catch(e){} }

/* ---------------- sound manager ---------------- */
const sounds = {
  click: new Audio('sounds/click.mp3?v=20260720-1'),
  toggle: new Audio('sounds/toggle.mp3'),
  search: new Audio('sounds/search.mp3'),
  result: new Audio('sounds/result.mp3'),
  muted: localGet('prefs:sound-muted') === 'true'
};
function playSound(name){
  if(sounds.muted || !sounds[name]) return;
  sounds[name].currentTime = 0;
  sounds[name].play().catch(()=>{});
}
function setSoundMuted(muted){ sounds.muted=!!muted; localSet('prefs:sound-muted',String(sounds.muted)); }

/* ---------------- 3D Bottle ---------------- */
let bottleCleanup = null;
function initHeroBottle(){
  const container=document.getElementById('heroBottleContainer');
  if(!container)return;
  if(bottleCleanup)bottleCleanup();
  if(!window.THREE||!THREE.GLTFLoader){container.innerHTML='<div class="ph">Interactive decant bottle</div>';return;}
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(34,container.clientWidth/Math.max(container.clientHeight,1),.1,100);
  camera.position.set(0,.05,8.8);
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));renderer.setSize(container.clientWidth,container.clientHeight);
  renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  container.querySelector('canvas')?.remove();container.prepend(renderer.domElement);
  scene.add(new THREE.HemisphereLight(0xfffaf0,0x10131a,1.65));
  const key=new THREE.DirectionalLight(0xffe3a0,3);key.position.set(4,6,6);scene.add(key);
  const rim=new THREE.PointLight(0x91c8ff,2.5);rim.position.set(-4,2,-1);scene.add(rim);
  const front=new THREE.PointLight(0xffffff,1.5);front.position.set(0,-1,5);scene.add(front);
  const group=new THREE.Group();
  const disposables=[];
  group.rotation.set(.035,-Math.PI/2,-.025);scene.add(group);
  const featurePoints={seal:new THREE.Vector3(.3,.7,.05),atomizer:new THREE.Vector3(.3,1.9,.04),sticker:new THREE.Vector3(.46,-.6,.02),glass:new THREE.Vector3(.46,-1.25,.02)};
  const guideLines={seal:container.querySelector('[data-guide="seal"]'),atomizer:container.querySelector('[data-guide="atomizer"]'),sticker:container.querySelector('[data-guide="sticker"]'),glass:container.querySelector('[data-guide="glass"]')};
  const guideDots={seal:container.querySelector('[data-dot="seal"]'),atomizer:container.querySelector('[data-dot="atomizer"]'),sticker:container.querySelector('[data-dot="sticker"]'),glass:container.querySelector('[data-dot="glass"]')};
  const callouts={seal:container.querySelector('[data-callout="seal"]'),atomizer:container.querySelector('[data-callout="atomizer"]'),sticker:container.querySelector('[data-callout="sticker"]'),glass:container.querySelector('[data-callout="glass"]')};
  function updateGuides(){const rect=container.getBoundingClientRect();Object.keys(featurePoints).forEach(key=>{const p=group.localToWorld(featurePoints[key].clone()).project(camera);const x=(p.x*.5+.5)*rect.width,y=(-p.y*.5+.5)*rect.height;const calloutRect=callouts[key]?.getBoundingClientRect();const tx=calloutRect?calloutRect.left-rect.left+(calloutRect.width/2):x,ty=calloutRect?calloutRect.top-rect.top+(calloutRect.height/2):y;guideLines[key]?.setAttribute('x1',x);guideLines[key]?.setAttribute('y1',y);guideLines[key]?.setAttribute('x2',tx);guideLines[key]?.setAttribute('y2',ty);guideDots[key]?.setAttribute('cx',x);guideDots[key]?.setAttribute('cy',y);});}
  const labelCanvas=document.createElement('canvas');labelCanvas.width=2048;labelCanvas.height=640;
  const labelContext=labelCanvas.getContext('2d');
  const drawLabel=logo=>{
    labelContext.clearRect(0,0,labelCanvas.width,labelCanvas.height);
    labelContext.fillStyle='#f5f3ed';
    labelContext.fillRect(0,0,labelCanvas.width,labelCanvas.height);
    if(logo){
      labelContext.save();
      labelContext.filter='contrast(3.2) brightness(.22)';
      labelContext.drawImage(logo,560,70,928,500);
      labelContext.restore();
    }
  };
  drawLabel();
  const labelTexture=new THREE.CanvasTexture(labelCanvas);labelTexture.encoding=THREE.sRGBEncoding;disposables.push(labelTexture);
  const labelMaterial=new THREE.MeshPhysicalMaterial({map:labelTexture,color:0xffffff,roughness:.42,metalness:0,transparent:false,opacity:1,side:THREE.DoubleSide,depthWrite:true});disposables.push(labelMaterial);
  const logoImage=new Image();logoImage.onload=()=>{drawLabel(logoImage);labelTexture.needsUpdate=true;};logoImage.src='images/bottle-logo.png';
  const loader=new THREE.GLTFLoader();
  loader.load('models/decant.gltf',gltf=>{
    const model=gltf.scene;
    model.traverse(node=>{if(!node.isMesh)return;node.castShadow=false;node.receiveShadow=false;if(node.material){node.material=Array.isArray(node.material)?node.material.map(m=>m.clone()):node.material.clone();const materials=Array.isArray(node.material)?node.material:[node.material];materials.forEach(m=>{disposables.push(m);if(m.transparent){m.depthWrite=false;m.side=THREE.DoubleSide;}m.needsUpdate=true;});}});
    const initialBox=new THREE.Box3().setFromObject(model),initialSize=initialBox.getSize(new THREE.Vector3());
    const scale=4.85/Math.max(initialSize.x,initialSize.y,initialSize.z);model.scale.setScalar(scale);
    const box=new THREE.Box3().setFromObject(model),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
    model.position.sub(center);group.add(model);
    const radius=Math.max(size.x,size.z)*.515;
    const labelGeometry=new THREE.CylinderGeometry(radius,radius,size.y*.185,96,1,true);disposables.push(labelGeometry);
    const label=new THREE.Mesh(labelGeometry,labelMaterial);label.position.y=-size.y*.12;label.rotation.y=-Math.PI/2;label.renderOrder=8;group.add(label);
    featurePoints.seal.set(radius*.52,size.y*.17,0);
    featurePoints.atomizer.set(radius*.46,size.y*.39,0);
    featurePoints.sticker.set(radius*.94,-size.y*.12,0);
    featurePoints.glass.set(radius*.92,-size.y*.24,0);
    container.classList.add('model-ready');
  },undefined,()=>{container.classList.add('model-error');showToast('The 3D bottle could not be loaded.');});
  let dragging=false,lastX=0,lastY=0,velocityX=0,velocityY=.004,raf=0;
  let userRotationX=group.rotation.x,userRotationY=group.rotation.y;
  let scrollTarget=0,scrollCurrent=0,heroStart=0,heroRange=Math.max(window.innerHeight,1);
  const down=e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;container.setPointerCapture?.(e.pointerId);};
  const move=e=>{if(!dragging)return;velocityY=(e.clientX-lastX)*.008;velocityX=(e.clientY-lastY)*.006;lastX=e.clientX;lastY=e.clientY;};
  const up=()=>{dragging=false;};
  container.addEventListener('pointerdown',down);container.addEventListener('pointermove',move);container.addEventListener('pointerup',up);container.addEventListener('pointercancel',up);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const syncScrollTarget=()=>{scrollTarget=(reduced||window.innerWidth<720)?0:Math.max(0,Math.min(1,(window.scrollY-heroStart)/(heroRange*.82)));};
  const measureScroll=()=>{const hero=container.closest('.hero');heroStart=hero?.offsetTop||0;heroRange=Math.max(hero?.offsetHeight||window.innerHeight,window.innerHeight*.8);syncScrollTarget();};
  function animate(){
    raf=requestAnimationFrame(animate);
    if(!dragging){velocityX*=.94;velocityY*=.965;if(Math.abs(velocityY)<.001&&!reduced)velocityY=.0015;}
    userRotationY+=velocityY;
    userRotationX=Math.max(-.35,Math.min(.35,userRotationX+velocityX));
    scrollCurrent+=(scrollTarget-scrollCurrent)*(reduced?1:.055);
    group.rotation.y=userRotationY+(scrollCurrent*.24);
    group.rotation.x=userRotationX-(scrollCurrent*.045);
    group.position.y=scrollCurrent*-.18;
    group.scale.setScalar(1-(scrollCurrent*.035));
    updateGuides();renderer.render(scene,camera);
  }animate();
  const resize=()=>{const w=container.clientWidth,h=container.clientHeight;camera.aspect=w/Math.max(h,1);camera.updateProjectionMatrix();renderer.setSize(w,h);measureScroll();};
  window.addEventListener('resize',resize,{passive:true});
  window.addEventListener('scroll',syncScrollTarget,{passive:true});measureScroll();
  bottleCleanup=()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize);window.removeEventListener('scroll',syncScrollTarget);container.removeEventListener('pointerdown',down);container.removeEventListener('pointermove',move);container.removeEventListener('pointerup',up);container.removeEventListener('pointercancel',up);renderer.dispose();disposables.forEach(x=>x.dispose?.());};
}

/* ---------------- state ---------------- */
const state = {
  theme: "dark",
  cart: [],        // {productId, size, qty}
  wishlist: [],     // productId[]
  recentSearches: [],
  voucherCode: "",
  content: null,
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
      eyebrow: "Nationwide Delivery (J&T Express) · Same-Day Delivery (Lalamove)",
      headlineBefore: "Find Your",
      headlineEm: "Signature",
      headlineAfter: "Scent",
      lede: "Try before you commit. Authentic fragrance decants, poured fresh and prepared for a premium sampling experience.",
    },
    buildBand: {
      eyebrow: "A private consultation",
      heading: "Build My Collection",
      paragraph: "Answer a few quick questions, and we'll recommend a personalized fragrance collection based on your style, lifestyle, and budget.",
    },
    brandsSection: {
      heading: "Explore Brands",
      paragraph: "Explore a growing curation of designer icons and standout Middle Eastern fragrances, chosen to make discovering your next scent feel effortless.",
    },
    whySection: {
      eyebrow: "The case for decants",
      heading: "Why Sample First",
      paragraph: "A full bottle is a commitment. A decant is a conversation with a scent before you fall in love.",
      cards: [
        {title:"Avoid Expensive Blind Buys", desc:"Test the real thing on your own skin before spending on a full 50–100ml bottle."},
        {title:"Experience Before Committing", desc:"Notes read differently on paper than on skin. Live with a scent for days, not seconds."},
        {title:"Authentic, Hand-Decanted", desc:"Hand-decanted from authentic bottles to ensure the original fragrance experience."},
        {title:"Affordable Exploration", desc:"Build a rotation of five fragrances for the price most people pay for one full bottle."},
      ],
    },
    testimonials: [
      {photo:null, name:"Marga, Quezon City", rating:5, text:"Finally a way to try Khamrah and Hawas without buying two full bottles I might not even like. Shipping was quick too."},
      {photo:null, name:"Jerome, Cebu", rating:5, text:"The Build My Collection questionnaire actually understood what I wanted. Got matched with three scents I now wear on rotation."},
      {photo:null, name:"Angeli, Davao", rating:5, text:"Decants arrived carefully packed, labeled clearly, and smelled exactly like the reviews said. My go-to for discovering new houses."},
    ],
    about: {
      photo: "images/our-story.png",
      heading: "Where Decant Dynasty Began",
      paragraph: "Decant Dynasty began in 2024 while I was a college student with a small fragrance collection and a practical goal: earn back some of what I had spent on the bottles I owned, then use it to explore more scents. Selling decants made that possible while giving other people a more affordable way to experience a fragrance before committing to a full bottle. What started as a simple way to support my hobby gradually became a DTI- and BIR-registered business built around careful preparation, honest service, and making fragrance discovery easier. Today, customers can shop with us directly or through our official Shopee store.",
      shopeeUrl: "https://shopee.ph/decantdynasty",
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
  return BRANDS.find(b=>b.id===id) || null;
}
function allBrands(){ return BRANDS.map(b=>getBrand(b.id)).sort((a,b)=>a.name.localeCompare(b.name)); }
function brandProductCount(id){ return PRODUCTS.filter(p=>p.brandId===id).length; }

function getProduct(id){
  return PRODUCTS.find(p=>p.id===id) || null;
}
function allProducts(){ return PRODUCTS.map(p=>getProduct(p.id)).sort((a,b)=>a.brand.localeCompare(b.brand)||a.name.localeCompare(b.name)); }
function productsByBrand(brandId){ return PRODUCTS.map(p=>getProduct(p.id)).filter(p=>p.brandId===brandId).sort((a,b)=>a.name.localeCompare(b.name)); }

function imgTag(src, alt, cls, fallbackText){
  const safeAlt = esc(alt);
  return `<img src="${esc(src)}" alt="${safeAlt}" class="${cls||''}"
    onerror="this.onerror=null;this.hidden=true;this.nextElementSibling.classList.remove('hidden')" loading="lazy" />
    <div class="ph hidden">${esc(fallbackText||alt)}</div>`;
}

/* ---------------- persistence bootstrap ---------------- */
function loadPersisted(){
  const theme = localGet("prefs:theme");
  if(theme) state.theme = theme;
  document.documentElement.setAttribute("data-theme", state.theme);

  const cart = localGet("cart:v1");
  if(cart) { try{ state.cart = JSON.parse(cart); }catch(e){} }

  const wish = localGet("wishlist:v1");
  if(wish) { try{ state.wishlist = JSON.parse(wish); }catch(e){} }

  state.content = defaultContent();
  const recent=localGet("search:recent");
  if(recent){try{state.recentSearches=JSON.parse(recent).slice(0,5);}catch(e){}}
  updateBadges();
}

function persistCart(){ localSet("cart:v1",JSON.stringify(state.cart)); }
function persistWishlist(){ localSet("wishlist:v1",JSON.stringify(state.wishlist)); }
function persistTheme(){ localSet("prefs:theme",state.theme); }

/* ---------------- cart / wishlist logic ---------------- */
function addToCart(productId, size, qty){
  const product = getProduct(productId);
  if(!product){ toast("That fragrance could not be found"); return false; }
  if(product.outOfStock){ toast(`${product.name} is currently out of stock`); return false; }
  qty = qty || 1;
  const existing = state.cart.find(c=>c.productId===productId && c.size===size);
  if(existing) existing.qty += qty;
  else state.cart.push({productId, size, qty});
  persistCart(); updateBadges(); renderCartPanel(); toast("Added to your bag");
  return true;
}
function removeFromCart(idx){ state.cart.splice(idx,1); persistCart(); updateBadges(); renderCartPanel(); }
function changeQty(idx, delta){
  const item = state.cart[idx];
  if(!item) return;
  const nextQty = item.qty + delta;
  if(nextQty <= 0){ removeFromCart(idx); return; }
  item.qty = nextQty;
  persistCart(); updateBadges(); renderCartPanel();
}
function changeCartSize(idx, nextSize){
  const item = state.cart[idx];
  const product = item && getProduct(item.productId);
  if(!item || !product || !Object.prototype.hasOwnProperty.call(product.prices,nextSize) || item.size===nextSize) return;
  const matchingIdx = state.cart.findIndex((line,lineIdx)=>lineIdx!==idx && line.productId===item.productId && line.size===nextSize);
  if(matchingIdx>-1){
    state.cart[matchingIdx].qty += item.qty;
    state.cart.splice(idx,1);
  } else {
    item.size = nextSize;
  }
  persistCart(); updateBadges(); renderCartPanel();
}
function cartTotal(){
  return state.cart.reduce((sum,c)=>{
    const p = getProduct(c.productId); if(!p) return sum;
    return sum + (p.prices[c.size]||0)*c.qty;
  },0);
}
function voucherDiscount(){ return state.voucherCode==="DD50"&&cartTotal()>=599?50:0; }
function checkoutTotal(){ return Math.max(0,cartTotal()-voucherDiscount()); }
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
  const discount=voucherDiscount();
  if(discount){lines.push(`Subtotal: ${peso(cartTotal())}`);lines.push(`Voucher DD50: -${peso(discount)}`);}
  lines.push(`Total: ${peso(checkoutTotal())}`);
  lines.push(`Order Reference: ${ref}`);
  lines.push(``);
  lines.push(`Name: `);
  lines.push(`Contact Number: `);
  lines.push(`Delivery Address: `);
  lines.push(`Mode of Delivery: `);
  return {ref, text: lines.join("\n")};
}
function openCheckout(){
  if(state.cart.length===0){ toast("Your bag is empty"); return; }
  const unavailable = state.cart.map(c=>getProduct(c.productId)).filter(p=>p&&p.outOfStock);
  if(unavailable.length){ toast("Remove out-of-stock items before checkout"); return; }
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
        the chat with our team to complete your order.
      </p>
      <div class="copy-box" id="checkoutText">${esc(text)}</div>
      <div class="checkout-instructions">
        <h3>How to order?</h3>
        <ol>
          <li><strong>Fill out the form above and send it to us by clicking “Open Messenger”.</strong></li>
          <li><strong>Ask our admin for the payment details.</strong></li>
          <li><strong>Kindly wait for our admin to send your invoice.</strong></li>
          <li><strong>Settle your payment and send your proof of payment.</strong></li>
          <li><strong>Once confirmed, we will process your order.</strong></li>
          <li><strong>We ship nationwide via J&amp;T Express. You may also book Lalamove for same-day delivery.</strong></li>
          <li><strong>Don’t forget to share your experience with us once your order arrives.</strong></li>
        </ol>
        <p>Please note: we do not accept Cash On Delivery (COD), and the shipping fee is shouldered by the buyer.</p>
      </div>
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
const motionMedia=matchMedia('(prefers-reduced-motion: reduce)');
function prepareMotionText(root){
  (root||document).querySelectorAll('.section-head h2,.page-header h1,.about-hero h1').forEach(heading=>{
    if(heading.dataset.motionSplit||heading.querySelector('img'))return;
    const words=heading.textContent.trim().split(/\s+/);
    heading.innerHTML=words.map((word,index)=>`<span class="motion-word" style="--word-index:${index}"><span>${esc(word)}</span></span>`).join(' ');
    heading.dataset.motionSplit='true';
  });
}
function motionTargets(root){
  const selector='.reveal,.stagger,.page-header,.pd-grid';
  const scope=root||document;
  return [...(scope.matches?.(selector)?[scope]:[]),...scope.querySelectorAll(selector)];
}
function initReveal(root,reset=false){
  const scope=root||document;
  prepareMotionText(scope);
  const targets=motionTargets(scope);
  targets.forEach(el=>{
    if(el.classList.contains('brand-grid'))el.dataset.motion='brands';
    else if(el.classList.contains('product-grid'))el.dataset.motion='products';
    else if(el.classList.contains('why-grid'))el.dataset.motion='features';
    else if(el.classList.contains('story-photo'))el.dataset.motion='image';
    [...el.children].forEach((child,index)=>child.style.setProperty('--stagger-index',el.classList.contains('product-grid')?Math.min(index,12):index));
  });
  if(motionMedia.matches||!('IntersectionObserver' in window)){
    document.documentElement.classList.remove('motion-enabled');
    targets.forEach(el=>el.classList.add('in'));
    return;
  }
  document.documentElement.classList.add('motion-enabled');
  if(reset&&revealObserver){revealObserver.disconnect();revealObserver=null;}
  if(!revealObserver)revealObserver=new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      entry.target.classList.add('in');
      revealObserver.unobserve(entry.target);
      setTimeout(()=>entry.target.classList.add('motion-settled'),1250);
    });
  },{threshold:0,rootMargin:'0px 0px 18% 0px'});
  targets.forEach(el=>revealObserver.observe(el));
}
function initBrandInteractions(root){
  if(motionMedia.matches||!matchMedia('(pointer:fine)').matches)return;
  (root||document).querySelectorAll('.brand-card:not([data-depth-ready])').forEach(card=>{
    card.dataset.depthReady='true';
    card.addEventListener('pointermove',event=>{
      card.classList.add('is-pointer-active');
      const rect=card.getBoundingClientRect();
      const x=(event.clientX-rect.left)/rect.width;
      const y=(event.clientY-rect.top)/rect.height;
      card.style.setProperty('--glow-x',`${x*100}%`);
      card.style.setProperty('--glow-y',`${y*100}%`);
      card.style.setProperty('--tilt-x',`${(0.5-y)*5}deg`);
      card.style.setProperty('--tilt-y',`${(x-0.5)*6}deg`);
    });
    card.addEventListener('pointerleave',()=>{
      card.classList.remove('is-pointer-active');
      card.style.setProperty('--glow-x','50%');card.style.setProperty('--glow-y','50%');
      card.style.setProperty('--tilt-x','0deg');card.style.setProperty('--tilt-y','0deg');
    });
  });
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
  const arrivals = PRODUCTS.slice(-8).reverse().slice(0,4).map(p=>getProduct(p.id));
  const brands = allBrands().slice(0,8);
  const c = state.content;
  return `
  <section class="hero">
    <div class="wrap hero-grid">
      <div class="hero-copy">
        <div class="eyebrow hero-kicker">${esc(c.hero.eyebrow)}</div>
        <h1 class="hero-title-art"><img src="images/find-your-signature-scent.png" alt="Find Your Signature Scent" /></h1>
        <p class="lede">${esc(fillTemplate(c.hero.lede))}</p>
        <div class="hero-actions">
          <a href="#/collection" class="btn btn-cta btn-cta-build">Shop Decants</a>
          <a href="#/build" class="btn btn-cta btn-cta-browse">Build My Collection</a>
        </div>
      </div>
      <div class="hero-art" id="heroBottleContainer" aria-label="Interactive Decant Dynasty atomizer bottle. Drag to rotate.">
        <svg class="bottle-guides" aria-hidden="true">
          <line data-guide="seal"/><circle data-dot="seal" r="4"/>
          <line data-guide="atomizer"/><circle data-dot="atomizer" r="4"/>
          <line data-guide="sticker"/><circle data-dot="sticker" r="4"/>
          <line data-guide="glass"/><circle data-dot="glass" r="4"/>
        </svg>
        <div class="bottle-callout callout-seal" data-callout="seal"><b>PARAFILM Sealed</b><span>Locked in for a clean, leak-resistant journey.</span></div>
        <div class="bottle-callout callout-atomizer" data-callout="atomizer"><b>QUALITY Atomizer</b><span>A smooth, controlled mist with every press.</span></div>
        <div class="bottle-callout callout-sticker" data-callout="sticker"><b>STICKER Label</b><span>Custom labels inspired by the original fragrance presentation.</span></div>
        <div class="bottle-callout callout-glass" data-callout="glass"><b>HARD Glass Bottle</b><span>Clear, durable glass protects every decant.</span></div>
      </div>
    </div>
  </section>

  <section class="motion-section motion-section-brands">
    <div class="wrap">
      <div class="section-head reveal">
        <h2>${esc(c.brandsSection.heading)}</h2>
        <p>${esc(c.brandsSection.paragraph)}</p>
      </div>
      <div class="brand-grid stagger">
        ${brands.map(b=>brandCardHTML(b)).join("")}
      </div>
      <div style="text-align:center;margin-top:48px;">
        <a href="#/brands" class="btn btn-ghost">View All Brands</a>
      </div>
    </div>
  </section>

  <section class="motion-section motion-section-products">
    <div class="wrap">
      <div class="section-head reveal">
        <div class="eyebrow">Just poured</div>
        <h2>New Arrivals</h2>
      </div>
      <div class="product-grid stagger">${arrivals.map(productCardHTML).join("")}</div>
    </div>
  </section>

  <section class="motion-section motion-section-features">
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

  <section class="motion-section motion-section-products home-full-collection">
    <div class="wrap">
      <div class="section-head reveal">
        <div class="eyebrow">Every fragrance, one place</div>
        <h2>The Full Collection</h2>
        <p>Explore every authentic decant currently available from Decant Dynasty.</p>
      </div>
      <div class="product-grid stagger">${allProducts().map(productCardHTML).join("")}</div>
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
  return `<div class="brand-card brand-card-logo-only" data-go="/brand/${b.id}" role="link" tabindex="0" aria-label="Explore ${esc(b.name)} fragrances">
    <div class="brand-arrow"><svg viewBox="0 0 24 24" stroke="var(--ink)" fill="none" stroke-width="1.6"><line x1="5" y1="19" x2="19" y2="5"/><polyline points="9 5 19 5 19 15"/></svg></div>
    <div class="brand-logo-wrap">
      ${b.logo ? imgTag(b.logo, b.name, "", b.name[0]) : `<span class="fallback">${esc(b.name[0])}</span>`}
    </div>
    <div class="brand-count">${count} fragrance${count===1?"":"s"}</div>
    <div class="brand-desc">Tap to explore the full ${esc(b.name)} decant range.</div>
  </div>`;
}
function stockStampHTML(p){
  return p.outOfStock ? `<div class="stock-stamp" aria-label="Out of stock">OUT OF STOCK</div>` : "";
}
function productCardHTML(p){
  const isWish = state.wishlist.includes(p.id);
  const sizes = Object.keys(p.prices);
  return `<div class="product-card" data-go="/product/${p.id}">
    ${p.recommended ? `<div class="badge-rec">Best Seller</div>` : ""}
    <div class="product-media">
      ${imgTag(p.image, `${p.brand} ${p.name}`, "", `${p.brand} — ${p.name}`)}
      ${stockStampHTML(p)}
      <button class="wish-toggle ${isWish?'active':''}" data-wish-toggle="${p.id}" data-stop aria-label="Wishlist">
        <svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.7-10-9.3C.5 8.2 2.4 5 6 5c2 0 3.4 1 4.5 2.4l1.5 1.9 1.5-1.9C14.6 6 16 5 18 5c3.6 0 5.5 3.2 4 6.7C19.5 16.3 12 21 12 21z"/></svg>
      </button>
      <button class="quick-view-btn" data-quickview="${p.id}" data-stop>Quick View</button>
    </div>
    <div class="product-body">
      <div class="product-brand">${esc(p.brand)}</div>
      <div class="product-name">${esc(p.name)}</div>
      ${p.inspiredBy?`<div class="dupe-label">Inspired by ${esc(p.inspiredBy)}</div>`:""}
      ${p.matchReason?`<div style="font-size:12px;color:var(--green);font-weight:650;margin:-4px 0 10px;">Matched for: ${esc(p.matchReason)}</div>`:""}
      <div class="product-meta-row">
        <div class="product-price"><small>Starting at</small> ${peso(Math.min(...Object.values(p.prices)))}</div>
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
      <div class="brand-grid stagger">${allBrands().map(brandCardHTML).join("")}</div>
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
      <div class="product-grid stagger" id="brandProductGrid">${products.map(productCardHTML).join("")}</div>
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
        <div class="brand-picker" id="brandFilterPicker">
          <span class="brand-picker-kicker">Browse by house</span>
          <button class="brand-picker-trigger" id="brandFilterButton" type="button" aria-haspopup="listbox" aria-expanded="false" aria-controls="brandFilterMenu">
            <span id="brandFilterValue">All fragrance houses</span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 9 5 5 5-5"/></svg>
          </button>
          <button class="brand-picker-scrim" type="button" tabindex="-1" aria-label="Close fragrance house menu"></button>
          <div class="brand-picker-menu" id="brandFilterMenu" role="listbox" aria-label="Fragrance houses">
            <label class="brand-picker-search">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>
              <input id="brandFilterSearch" type="search" placeholder="Find a fragrance house" autocomplete="off" aria-label="Find a fragrance house" />
            </label>
            <div class="brand-picker-options">
              <button type="button" role="option" aria-selected="true" data-brand-option="all" data-brand-name="All fragrance houses">
                <span>All fragrance houses</span><small>${products.length} scents</small>
              </button>
              ${brandOptions.map(b=>{const count=products.filter(p=>p.brandId===b.id).length;return `<button type="button" role="option" aria-selected="false" data-brand-option="${b.id}" data-brand-name="${esc(b.name)}"><span>${esc(b.name)}</span><small>${count} ${count===1?'scent':'scents'}</small></button>`;}).join("")}
              <p class="brand-picker-empty" hidden>No fragrance houses found.</p>
            </div>
          </div>
        </div>
      </div>
      <div class="product-grid stagger" id="collectionGrid">${products.map(productCardHTML).join("")}</div>
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
  const hasImage2 = !!p.image2;
  return `
  <div class="wrap pd-grid" id="pdWrap" data-pid="${p.id}" data-size="${firstSize}">
    <div>
      <div class="pd-media">${imgTag(p.image, `${p.brand} ${p.name}`, "", `${p.brand} — ${p.name}`)}${stockStampHTML(p)}</div>
      ${hasImage2 ? `<div class="pd-media pd-media-2"><img src="${esc(p.image2)}" alt="${esc(`${p.brand} ${p.name} decant bottle`)}" loading="lazy" onerror="this.parentElement.remove()" /></div>` : ""}
    </div>
    <div>
      <div class="breadcrumb"><a href="#/">Home</a> / <a href="#/brand/${p.brandId}">${esc(p.brand)}</a> / ${esc(p.name)}</div>
      <div class="pd-brand">${esc(p.brand)}</div>
      <h1 class="pd-name">${esc(p.name)}</h1>
      ${p.inspiredBy?`<div class="pd-inspiration"><span>Inspired by</span> ${esc(p.inspiredBy)}</div>`:""}
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
        <button class="btn btn-primary" id="pdAddToCart" ${p.outOfStock?'disabled aria-disabled="true"':''}>${p.outOfStock?'Out of Stock':'Add to Bag'}</button>
        <button class="btn btn-ghost" id="pdWishBtn" data-wish-toggle="${p.id}">${state.wishlist.includes(p.id) ? "♥ In Wishlist" : "♡ Add to Wishlist"}</button>
      </div>
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
      <div class="modal-media">${imgTag(p.image, `${p.brand} ${p.name}`, "", `${p.brand} — ${p.name}`)}${stockStampHTML(p)}</div>
      <div class="modal-body">
        <div class="pd-brand">${esc(p.brand)}</div>
        <h2 class="pd-name" style="font-size:26px;">${esc(p.name)}</h2>
        ${p.inspiredBy?`<div class="pd-inspiration"><span>Inspired by</span> ${esc(p.inspiredBy)}</div>`:""}
        <p class="pd-desc" style="font-size:13.5px;">${esc(p.description)}</p>
        ${notesPyramid(p)}
        <div class="eyebrow" style="margin-bottom:10px;">Choose Size</div>
        <div class="size-select" id="qvSizeWrap">${sizeSelectHTML(p, firstSize)}</div>
        <div class="pd-actions">
          <button class="btn btn-primary" id="qvAddToCart" ${p.outOfStock?'disabled aria-disabled="true"':''}>${p.outOfStock?'Out of Stock':'Add to Bag'}</button>
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
  {key:"character", q:"What should your scent communicate first?", opts:["Fresh & effortless","Warm & magnetic","Elegant & polished","Bold & unexpected"]},
  {key:"gender", q:"Which fragrance profile should we prioritize?", opts:["Masculine","Feminine","Unisex","Surprise me"]},
  {key:"budget", q:"What's a comfortable decant budget to start?", opts:["Under ₱300","₱300–₱700","₱700–₱1,500","No limit — I want the full experience"]},
];
let quizAnswers = {};
let quizStep = 0;
function pickForAnswers(){
  const groups={
    fresh:["bergamot","grapefruit","marine","aquatic","citrus","mint","lavender","apple","pear","musk","cedar"],
    warm:["vanilla","amber","tonka","cinnamon","tobacco","coffee","caramel","cognac","oud","sandalwood"],
    floral:["rose","jasmine","peony","orange blossom","lily","iris","violet"],
    bold:["oud","leather","saffron","incense","patchouli","pepper","cognac","tobacco"]
  };
  const wanted={"Fresh & effortless":"fresh","Warm & magnetic":"warm","Elegant & polished":"floral","Bold & unexpected":"bold"}[quizAnswers.character];
  const wantedGender={Masculine:"Men",Feminine:"Women",Unisex:"Unisex"}[quizAnswers.gender];
  const budgetCap={"Under ₱300":300,"₱300–₱700":700,"₱700–₱1,500":1500,"No limit — I want the full experience":Infinity}[quizAnswers.budget]||Infinity;
  const scored=allProducts().filter(p=>!p.outOfStock).map(p=>{
    const text=[p.description,...p.topNotes,...p.heartNotes,...p.baseNotes,p.longevity,p.projection].join(' ').toLowerCase();
    let score=0;const reasons=[];
    if(wanted){const hits=groups[wanted].filter(n=>text.includes(n)).length;score+=hits*3.2;if(hits)reasons.push(`${wanted} scent profile`);}
    if(wantedGender){if(p.gender===wantedGender){score+=7;reasons.push(`${wantedGender.toLowerCase()} profile`);}else if(p.gender==='Unisex')score+=3;else score-=3;}
    if(quizAnswers.gender==='Surprise me'&&p.gender==='Unisex')score+=2;
    if(quizAnswers.climate==='Hot & humid'){score+=groups.fresh.filter(n=>text.includes(n)).length*2.4;if(/strong|long/.test(text))score-=1;}
    if(quizAnswers.climate==='Cool evenings'){score+=groups.warm.filter(n=>text.includes(n)).length*2.4;if(/long|strong/.test(text))score+=2;}
    if(quizAnswers.climate==='Warm, occasional rain')score+=(groups.fresh.concat(groups.warm)).filter(n=>text.includes(n)).length*1.1;
    if(quizAnswers.lifestyle==='Office & meetings'){if(/moderate|soft/.test(text))score+=4;if(/strong/.test(text))score-=1;}
    if(quizAnswers.lifestyle==='Active & outdoorsy')score+=groups.fresh.filter(n=>text.includes(n)).length*1.8;
    if(quizAnswers.lifestyle==='Nights out & social'){if(/strong|long/.test(text))score+=5;score+=groups.warm.filter(n=>text.includes(n)).length*1.4;}
    if(quizAnswers.lifestyle==='Creative & casual'&&p.gender==='Unisex')score+=4;
    if(quizAnswers.personality==='Confident'&&/strong|leather|oud|pepper/.test(text))score+=5;
    if(quizAnswers.personality==='Romantic')score+=groups.floral.concat(groups.warm).filter(n=>text.includes(n)).length*1.5;
    if(quizAnswers.personality==='Understated'&&/moderate|musk|cedar|lavender/.test(text))score+=4;
    if(quizAnswers.personality==='Adventurous'&&/oud|saffron|cognac|leather|unusual|distinctive/.test(text))score+=5;
    const entry=Math.min(...Object.values(p.prices));if(entry<=budgetCap)score+=5;else score-=Math.min(8,(entry-budgetCap)/75);
    if(p.recommended)score+=1.25;
    const reason=reasons.slice(0,2).join(' · ')||`${quizAnswers.personality.toLowerCase()} energy · ${quizAnswers.lifestyle.toLowerCase()}`;
    return {...p,matchReason:reason,matchScore:score};
  }).sort((a,b)=>b.matchScore-a.matchScore);
  const chosen=[],brands=new Set();
  for(const p of scored){if(!brands.has(p.brandId)||chosen.length>=3){chosen.push(p);brands.add(p.brandId);}if(chosen.length===4)break;}
  return chosen;
}
function renderBuild(){
  return `
  <div class="page-header wrap">
    <div class="breadcrumb"><a href="#/">Home</a> / Build My Collection</div>
    <h1>Build My Collection</h1>
    <p>Answer a few quick questions, and we'll recommend a personalized fragrance collection based on your style, lifestyle, and budget.</p>
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
    playSound('result');
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
        <h1 class="story-title">${esc(a.heading)}</h1>
        <p class="story-copy">
          ${esc(fillTemplate(a.paragraph))}
        </p>
        <a class="story-store-link" href="${esc(a.shopeeUrl)}" target="_blank" rel="noopener">Shop on Shopee · shopee.ph/decantdynasty</a>
      </div>
      ${a.photo ? `<figure class="story-photo reveal"><img src="${esc(a.photo)}" alt="The early fragrance collection that inspired Decant Dynasty" onerror="this.parentElement.remove()"/><figcaption>The early collection that inspired Decant Dynasty.</figcaption></figure>` : ""}
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
        <div class="ci-meta">Starting at ${peso(Math.min(...Object.values(p.prices)))}</div>
        <div style="display:flex;gap:10px;">
          <button class="btn btn-sm btn-ghost" data-wish-add-cart="${p.id}" ${p.outOfStock?'disabled aria-disabled="true"':''}>${p.outOfStock?'Out of Stock':'Add to Bag'}</button>
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
    const sizes = Object.keys(p.prices).sort((a,b)=>parseFloat(a)-parseFloat(b));
    return `<div class="cart-item">
      <a class="cart-product-thumb" href="#/product/${esc(p.id)}" data-cart-product aria-label="View ${esc(p.brand)} ${esc(p.name)}">
        ${imgTag(p.image, p.name, "", p.name)}
        ${stockStampHTML(p)}
      </a>
      <div class="cart-item-content">
        <a class="ci-name" href="#/product/${esc(p.id)}" data-cart-product>${esc(p.brand)} — ${esc(p.name)}</a>
        ${p.outOfStock?`<div class="cart-stock-warning">Out of stock — remove to checkout</div>`:""}
        <div class="cart-size-row">
          <label class="cart-size-label">Size
            <select data-cart-size="${idx}" aria-label="Size for ${esc(p.name)}">
              ${sizes.map(size=>`<option value="${esc(size)}" ${size===c.size?"selected":""}>${esc(size)} — ${peso(p.prices[size])}</option>`).join("")}
            </select>
          </label>
          <span class="cart-line-total">${peso((p.prices[c.size]||0)*c.qty)}</span>
        </div>
        <div class="qty-row">
          <button data-qty-minus="${idx}" aria-label="Decrease ${esc(p.name)} quantity">−</button>
          <span aria-label="Quantity">${c.qty}</span>
          <button data-qty-plus="${idx}" aria-label="Increase ${esc(p.name)} quantity">+</button>
          <button class="remove-x" data-cart-remove="${idx}">Remove</button>
        </div>
      </div>
    </div>`;
  }).join("");
  const subtotal=cartTotal(),discount=voucherDiscount();
  const hasUnavailable=state.cart.some(c=>getProduct(c.productId)?.outOfStock);
  const voucherMessage=state.voucherCode?(discount?`<div class="voucher-feedback success">DD50 applied — you saved ${peso(discount)}.</div>`:state.voucherCode==="DD50"?`<div class="voucher-feedback">Spend ${peso(Math.max(0,599-subtotal))} more to unlock DD50.</div>`:`<div class="voucher-feedback error">That voucher code isn't valid.</div>`):"";
  foot.innerHTML = `
    <div class="voucher-entry">
      <label for="voucherInput">Voucher code</label>
      <div><input id="voucherInput" value="${esc(state.voucherCode)}" placeholder="Enter code" maxlength="12" autocomplete="off"/><button class="btn btn-ghost btn-sm" id="applyVoucherBtn">Apply</button></div>
      ${voucherMessage}
    </div>
    <div class="subtotal-row"><span>Subtotal</span><span>${peso(subtotal)}</span></div>
    ${discount?`<div class="subtotal-row discount-row"><span>DD50 discount</span><span>−${peso(discount)}</span></div>`:""}
    <div class="subtotal-row total-row"><span>Total</span><span>${peso(subtotal-discount)}</span></div>
    <button class="btn btn-primary" style="width:100%;" id="checkoutBtn" ${hasUnavailable?'disabled aria-disabled="true"':''}>${hasUnavailable?'Remove unavailable items':'Checkout via Messenger'}</button>
    <p style="font-size:11.5px;color:var(--ink-soft);margin-top:10px;text-align:center;">Shipping fee shouldered by buyer · No COD</p>
  `;
  body.querySelectorAll("[data-qty-minus]").forEach(b=>b.onclick=()=>changeQty(+b.dataset.qtyMinus,-1));
  body.querySelectorAll("[data-qty-plus]").forEach(b=>b.onclick=()=>changeQty(+b.dataset.qtyPlus,1));
  body.querySelectorAll("[data-cart-size]").forEach(select=>select.onchange=()=>changeCartSize(+select.dataset.cartSize,select.value));
  body.querySelectorAll("[data-cart-remove]").forEach(b=>b.onclick=()=>removeFromCart(+b.dataset.cartRemove));
  body.querySelectorAll("[data-cart-product]").forEach(link=>link.onclick=()=>closeAllPanels());
  document.getElementById("applyVoucherBtn").onclick=()=>{state.voucherCode=document.getElementById("voucherInput").value.trim().toUpperCase();renderCartPanel();if(voucherDiscount())toast("DD50 applied — ₱50 off");};
  document.getElementById("voucherInput").onkeydown=e=>{if(e.key==="Enter")document.getElementById("applyVoucherBtn").click();};
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
  if(r.page!=="home"&&bottleCleanup){bottleCleanup();bottleCleanup=null;}
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
  initReveal(document,true);
  if(r.page==="home") initHeroBottle();
}

function bindCardNav(el){
  el.addEventListener("click",(e)=>{
    if(e.target.closest("[data-stop]")) return;
    const go = el.dataset.go;
    if(go){
      playSound("click");
      location.hash = "#"+go;
    }
  });
  el.addEventListener("keydown",e=>{
    if(e.target!==el||!['Enter',' '].includes(e.key))return;
    e.preventDefault();playSound("click");location.hash="#"+el.dataset.go;
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
  initBrandInteractions(document);

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
        grid.classList.remove('in','motion-settled');
        grid.innerHTML = items.map(productCardHTML).join("");
        grid.querySelectorAll("[data-go]").forEach(bindCardNav);
        grid.querySelectorAll("[data-wish-toggle]").forEach(bindWishButton);
        grid.querySelectorAll("[data-quickview]").forEach(bindQuickviewButton);
        initReveal(grid);
      };
    });
  }
  if(r.page==="collection"){
    const grid = document.getElementById("collectionGrid");
    const picker = document.getElementById("brandFilterPicker");
    const pickerButton = document.getElementById("brandFilterButton");
    const pickerValue = document.getElementById("brandFilterValue");
    const pickerSearch = document.getElementById("brandFilterSearch");
    const pickerScrim = picker.querySelector(".brand-picker-scrim");
    const pickerEmpty = picker.querySelector(".brand-picker-empty");
    const pickerOptions = [...picker.querySelectorAll("[data-brand-option]")];
    let curGender = "all", curBrand="all";
    function apply(){
      const items = allProducts().filter(p=>(curGender==="all"||p.gender===curGender)&&(curBrand==="all"||p.brandId===curBrand));
      grid.classList.remove('in','motion-settled');
      grid.innerHTML = items.length ? items.map(productCardHTML).join("") : `<div class="center-empty" style="grid-column:1/-1;">No fragrances match those filters yet.</div>`;
      grid.querySelectorAll("[data-go]").forEach(bindCardNav);
      grid.querySelectorAll("[data-wish-toggle]").forEach(bindWishButton);
      grid.querySelectorAll("[data-quickview]").forEach(bindQuickviewButton);
      initReveal(grid);
    }
    document.querySelectorAll("[data-cf-gender]").forEach(chip=>{
      chip.onclick = ()=>{ document.querySelectorAll("[data-cf-gender]").forEach(c=>c.classList.remove("active")); chip.classList.add("active"); curGender=chip.dataset.cfGender; apply(); };
    });
    function setPickerOpen(open){
      picker.classList.toggle("is-open",open);
      pickerButton.setAttribute("aria-expanded",String(open));
      if(!open){pickerSearch.value="";filterPickerOptions();}
    }
    function filterPickerOptions(){
      const query=pickerSearch.value.trim().toLowerCase();
      let visible=0;
      pickerOptions.forEach(option=>{
        const show=!query||option.dataset.brandName.toLowerCase().includes(query);
        option.hidden=!show;
        if(show)visible++;
      });
      pickerEmpty.hidden=visible!==0;
    }
    function chooseBrand(option){
      curBrand=option.dataset.brandOption;
      pickerValue.textContent=option.dataset.brandName;
      pickerOptions.forEach(item=>item.setAttribute("aria-selected",String(item===option)));
      setPickerOpen(false);
      apply();
      pickerButton.focus();
    }
    pickerButton.onclick=()=>setPickerOpen(!picker.classList.contains("is-open"));
    pickerScrim.onclick=()=>setPickerOpen(false);
    pickerSearch.oninput=filterPickerOptions;
    pickerSearch.onkeydown=e=>{
      if(e.key==="Escape"){e.preventDefault();e.stopPropagation();setPickerOpen(false);pickerButton.focus();}
      if(e.key==="ArrowDown"){e.preventDefault();pickerOptions.find(option=>!option.hidden)?.focus();}
      if(e.key==="Enter"){const first=pickerOptions.find(option=>!option.hidden);if(first){e.preventDefault();chooseBrand(first);}}
    };
    picker.onkeydown=e=>{
      if(e.key==="Escape"){e.preventDefault();setPickerOpen(false);pickerButton.focus();return;}
      const visible=pickerOptions.filter(option=>!option.hidden);
      const index=visible.indexOf(document.activeElement);
      if(document.activeElement===pickerButton&&(e.key==="ArrowDown"||e.key==="ArrowUp")){
        e.preventDefault();setPickerOpen(true);(e.key==="ArrowDown"?visible[0]:visible.at(-1))?.focus();return;
      }
      if(index<0)return;
      if(e.key==="ArrowDown"||e.key==="ArrowUp"){
        e.preventDefault();
        visible[(index+(e.key==="ArrowDown"?1:-1)+visible.length)%visible.length].focus();
      }
    };
    pickerOptions.forEach(option=>option.onclick=()=>chooseBrand(option));
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
  ["wishBackdrop","wishPanel","cartBackdrop","cartPanel"].forEach(id=>{
    document.getElementById(id)?.classList.remove("open");
  });
  document.getElementById('searchPopover')?.classList.remove('open');
  closeModal();
}
function initLoadingScreen(){
  const loader=document.getElementById("loadingScreen");if(!loader)return;
  const started=performance.now();let hidden=false;
  const hide=()=>{if(hidden)return;hidden=true;const delay=Math.max(0,1050-(performance.now()-started));setTimeout(()=>{loader.classList.add("is-hidden");setTimeout(()=>loader.remove(),750);},delay);};
  if(document.readyState==="complete")hide();else window.addEventListener("load",hide,{once:true});
  setTimeout(hide,2600);
}
function initVoucherPromo(){
  const backdrop=document.getElementById("promoBackdrop"),modal=document.getElementById("promoModal");if(!backdrop||!modal)return;
  let seen=false;try{seen=sessionStorage.getItem("promo:dd50-seen")==="true";}catch(e){}
  const close=()=>{backdrop.classList.remove("open");modal.classList.remove("open");try{sessionStorage.setItem("promo:dd50-seen","true");}catch(e){}};
  document.querySelectorAll("[data-close-promo]").forEach(button=>button.onclick=close);backdrop.onclick=close;
  document.getElementById("copyPromoCode").onclick=()=>{navigator.clipboard?.writeText("DD50");toast("DD50 copied");};
  document.getElementById("shopPromo").onclick=()=>{close();location.hash="#/collection";};
  if(!seen)setTimeout(()=>{backdrop.classList.add("open");modal.classList.add("open");},1750);
}
function initGlobalUI(){
  initLoadingScreen();
  initVoucherPromo();
  const navStack = document.getElementById("navStack");
  const progress=document.getElementById('scrollProgress');
  let scrollFrame=0;
  const syncScrollUI=()=>{
    scrollFrame=0;navStack.classList.toggle("scrolled",window.scrollY>10);
    const max=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);
    progress?.style.setProperty('--scroll-progress',Math.max(0,Math.min(1,window.scrollY/max)));
  };
  const queueScrollUI=()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(syncScrollUI);};
  window.addEventListener("scroll",queueScrollUI,{passive:true});window.addEventListener('resize',queueScrollUI,{passive:true});syncScrollUI();

  document.getElementById("menuBtn").onclick = ()=>{ document.getElementById("drawer").classList.add("open"); document.getElementById("drawerBackdrop").classList.add("open"); };
  document.getElementById("drawerBackdrop").onclick = closeDrawer;
  document.querySelectorAll("[data-close-drawer]").forEach(a=>a.addEventListener("click",closeDrawer));
  function closeDrawer(){ document.getElementById("drawer").classList.remove("open"); document.getElementById("drawerBackdrop").classList.remove("open"); }

  document.getElementById("themeBtn").onclick = ()=>{
    document.documentElement.classList.add('theme-changing');
    state.theme = state.theme==="dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", state.theme);
    persistTheme();playSound('toggle');
    document.getElementById('themeIcon').innerHTML=state.theme==='dark'?'<path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z"/>':'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';
    setTimeout(()=>document.documentElement.classList.remove('theme-changing'),800);
  };

  // wishlist panel
  document.getElementById("wishlistBtn").onclick = ()=>{ renderWishPanel(); document.getElementById("wishBackdrop").classList.add("open"); document.getElementById("wishPanel").classList.add("open"); };
  document.getElementById("wishBackdrop").onclick = ()=>{ document.getElementById("wishBackdrop").classList.remove("open"); document.getElementById("wishPanel").classList.remove("open"); };
  document.querySelector("[data-close-wish]").onclick = ()=>{ document.getElementById("wishBackdrop").classList.remove("open"); document.getElementById("wishPanel").classList.remove("open"); };

  // cart panel
  document.getElementById("cartBtn").onclick = ()=>{ renderCartPanel(); document.getElementById("cartBackdrop").classList.add("open"); document.getElementById("cartPanel").classList.add("open"); };
  document.getElementById("cartBackdrop").onclick = ()=>{ document.getElementById("cartBackdrop").classList.remove("open"); document.getElementById("cartPanel").classList.remove("open"); };
  document.querySelector("[data-close-cart]").onclick = ()=>{ document.getElementById("cartBackdrop").classList.remove("open"); document.getElementById("cartPanel").classList.remove("open"); };

  // inline fragrance search with recent searches
  const input=document.getElementById('searchInput'),popover=document.getElementById('searchPopover'),clear=document.getElementById('searchClear');
  const remember=q=>{state.recentSearches=[q,...state.recentSearches.filter(x=>x.toLowerCase()!==q.toLowerCase())].slice(0,5);localSet('search:recent',JSON.stringify(state.recentSearches));};
  const openSearch=()=>{popover.classList.add('open');input.setAttribute('aria-expanded','true');};
  const renderSearch=()=>{
    const raw=input.value.trim(),q=raw.toLowerCase();clear.classList.toggle('visible',!!raw);openSearch();
    if(!q){popover.innerHTML=state.recentSearches.length?`<div class="search-caption">Recent searches</div><div class="recent-chips">${state.recentSearches.map(x=>`<button class="recent-chip" data-recent="${esc(x)}">${esc(x)}</button>`).join('')}</div>`:`<div class="search-caption">Search by fragrance or house</div>`;popover.querySelectorAll('[data-recent]').forEach(b=>b.onclick=()=>{input.value=b.dataset.recent;renderSearch();});return;}
    const matches=allProducts().filter(p=>p.name.toLowerCase().includes(q)||p.brand.toLowerCase().includes(q)).slice(0,12);
    popover.innerHTML=matches.length?matches.map(p=>`<div class="search-result" role="option" tabindex="0" data-go-search="${p.id}" data-query="${esc(raw)}">${imgTag(p.image,p.name,'',p.name)}<div><div class="sr-name">${esc(p.name)}</div><div class="sr-brand">${esc(p.brand)}</div></div></div>`).join(''):`<div style="color:var(--ink-soft);font-size:13.5px;padding:20px;">No matches yet — try a house or fragrance name.</div>`;
    popover.querySelectorAll('[data-go-search]').forEach(el=>{const go=()=>{remember(el.dataset.query);location.hash='#/product/'+el.dataset.goSearch;popover.classList.remove('open');playSound('search');};el.onclick=go;el.onkeydown=e=>{if(e.key==='Enter')go();};});
  };
  document.getElementById('searchBtn').onclick=()=>{input.focus();renderSearch();};input.addEventListener('focus',renderSearch);input.addEventListener('input',renderSearch);
  clear.onclick=()=>{input.value='';input.focus();renderSearch();};document.addEventListener('click',e=>{if(!e.target.closest('#searchBox')&&!e.target.closest('#searchBtn')){popover.classList.remove('open');input.setAttribute('aria-expanded','false');}});
  document.addEventListener('click',e=>{const control=e.target.closest('button,.btn,a');if(control&&!['themeBtn','searchBtn','soundToggle'].includes(control.id))playSound('click');});
  const soundToggle=document.getElementById('soundToggle');
  const syncSoundLabel=()=>{soundToggle.textContent=sounds.muted?'Sound off':'Sound on';soundToggle.setAttribute('aria-pressed',String(sounds.muted));};
  soundToggle.onclick=()=>{setSoundMuted(!sounds.muted);syncSoundLabel();if(!sounds.muted)playSound('toggle');};syncSoundLabel();

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
(function init(){
  loadPersisted();
  initGlobalUI();
  route();
})();

})();
