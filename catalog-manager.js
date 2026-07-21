(function(){
"use strict";

const localHost=location.protocol==="file:"||["localhost","127.0.0.1","[::1]"].includes(location.hostname);
const publicLock=document.getElementById("publicLock");
const managerApp=document.getElementById("managerApp");
if(!localHost){publicLock.hidden=false;return;}
managerApp.hidden=false;

const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
const clone=value=>typeof structuredClone==="function"?structuredClone(value):JSON.parse(JSON.stringify(value));
const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
const managerSlug=value=>String(value||"").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");
const noteList=value=>String(value||"").split(/[,\n]/).map(note=>note.trim()).filter(Boolean);
const DRAFT_KEY="dd:catalog-manager:draft:v1";
const managed=globalThis.DECANT_MANAGED_CATALOG;
const source=managed?.version===1&&Array.isArray(managed.brands)&&Array.isArray(managed.products)?managed:{brands:BRANDS,products:PRODUCTS};
const state={brands:clone(source.brands),products:clone(source.products),section:"products",editingProductId:null,editingBrandId:null,productFile:null,brandFile:null,rootHandle:null,pendingAssets:new Map(),dirty:false,restored:false};

try{
  const draft=JSON.parse(localStorage.getItem(DRAFT_KEY)||"null");
  if(draft?.version===1&&Array.isArray(draft.brands)&&Array.isArray(draft.products)){
    state.brands=draft.brands;state.products=draft.products;state.dirty=true;state.restored=true;
  }
}catch(error){console.warn("Catalog draft could not be restored",error);}

const productForm=$("#productForm");
const brandForm=$("#brandForm");
const editorPanel=$("#editorPanel");
const editorScrim=$("#editorScrim");
const productImageInput=$("#productImageInput");
const brandImageInput=$("#brandImageInput");
let previewUrl="";
let toastTimer=0;

function toast(message){
  const element=$("#managerToast");element.textContent=message;element.classList.add("show");
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>element.classList.remove("show"),2600);
}
function setSaveState(){
  const label=$("#saveState");label.classList.toggle("dirty",state.dirty);
  label.lastChild.textContent=state.dirty?" Unsaved storefront changes":" Catalog matches saved file";
}
function persistDraft(){
  state.dirty=true;
  localStorage.setItem(DRAFT_KEY,JSON.stringify({version:1,updatedAt:new Date().toISOString(),brands:state.brands,products:state.products}));
  setSaveState();renderSummary();
}
function clearDraft(){state.dirty=false;localStorage.removeItem(DRAFT_KEY);setSaveState();}
function brandById(id){return state.brands.find(brand=>brand.id===id)||null;}
function productById(id){return state.products.find(product=>product.id===id)||null;}
function sortedBrands(){return [...state.brands].sort((a,b)=>a.name.localeCompare(b.name));}
function sortedProducts(){return [...state.products].sort((a,b)=>a.brand.localeCompare(b.brand)||a.name.localeCompare(b.name));}
function nextProductId(brandId,name){
  const base=`${brandId}-managed-${managerSlug(name)||"fragrance"}`;let id=base,index=2;
  while(productById(id)){id=`${base}-${index++}`;}return id;
}
function setPreview(element,path,file,contain=false){
  if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl="";}
  const sourceUrl=file?(previewUrl=URL.createObjectURL(file)):path;
  element.innerHTML=sourceUrl?`<img src="${esc(sourceUrl)}" alt="" style="object-fit:${contain?'contain':'cover'}" />`:`<span>No photo</span>`;
}
function renderSummary(){
  const total=state.products.length,out=state.products.filter(product=>product.outOfStock).length,available=total-out;
  $("#sideProductCount").textContent=total;$("#sideBrandCount").textContent=state.brands.length;
  $("#inventoryAvailable").textContent=`${available} available`;
  $("#inventoryStockText").textContent=`${out} product${out===1?"":"s"} out of stock`;
  $("#inventoryBar").style.width=`${total?available/total*100:0}%`;
}
function renderBrandOptions(){
  const options=sortedBrands().map(brand=>`<option value="${esc(brand.id)}">${esc(brand.name)}</option>`).join("");
  $("#brandFilter").innerHTML=`<option value="">All brands</option>${options}`;
  productForm.elements.brandId.innerHTML=options;
}
function productThumb(product){
  return `<div class="product-thumb"><img src="${esc(product.image)}" alt="" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span hidden>PNG</span></div>`;
}
function renderProducts(){
  const query=$("#productSearch").value.trim().toLowerCase();
  const brandId=$("#brandFilter").value,stock=$("#stockFilter").value;
  const products=sortedProducts().filter(product=>{
    const haystack=`${product.brand} ${product.name} ${product.inspiredBy||""}`.toLowerCase();
    return(!query||haystack.includes(query))&&(!brandId||product.brandId===brandId)&&(!stock||(stock==="out"?product.outOfStock:!product.outOfStock));
  });
  $("#productResultCount").textContent=`${products.length} product${products.length===1?"":"s"}`;
  $("#productTable").innerHTML=products.length?products.map(product=>{
    const lowest=Math.min(...Object.values(product.prices).map(Number));
    return `<button class="product-row" data-product-id="${esc(product.id)}">
      <span class="product-cell-main">${productThumb(product)}<span><b>${esc(product.name)}</b><small>${esc(product.brand)} · ${esc(product.concentration)}</small></span></span>
      <span><small class="table-label">Starting price</small><b class="product-price">₱${lowest}</b></span>
      <span><small class="table-label">Inspired by</small><span class="product-inspiration">${esc(product.inspiredBy||"Original profile")}</span></span>
      <span class="stock-pill ${product.outOfStock?'out':''}">${product.outOfStock?'Out of stock':'Available'}</span><span class="row-arrow">›</span>
    </button>`;
  }).join(""):`<div class="table-empty">No fragrances match these filters.</div>`;
}
function renderBrands(){
  const query=$("#brandSearch").value.trim().toLowerCase();
  const brands=sortedBrands().filter(brand=>brand.name.toLowerCase().includes(query));
  $("#brandGrid").innerHTML=brands.length?brands.map(brand=>{
    const count=state.products.filter(product=>product.brandId===brand.id).length;
    return `<button class="brand-manager-card" data-brand-id="${esc(brand.id)}"><span class="brand-manager-logo"><img src="${esc(brand.logo)}" alt="" loading="lazy"></span><span><b>${esc(brand.name)}</b><small>${count} fragrance${count===1?'':'s'} · ${esc(brand.id)}</small></span><i>↗</i></button>`;
  }).join(""):`<div class="table-empty">No brands match this search.</div>`;
}
function renderAll(){renderSummary();renderBrandOptions();renderProducts();renderBrands();setSaveState();}

function showSection(section){
  state.section=section;
  $("#productsSection").hidden=section!=="products";$("#brandsSection").hidden=section!=="brands";
  $$("[data-section]").forEach(button=>button.classList.toggle("active",button.dataset.section===section));
}
function openEditor(type,title,kicker){
  $("#editorTitle").textContent=title;$("#editorKicker").textContent=kicker;
  productForm.hidden=type!=="product";brandForm.hidden=type!=="brand";
  editorPanel.classList.add("open");editorScrim.classList.add("open");editorPanel.setAttribute("aria-hidden","false");
  setTimeout(()=>$("input:not([type=hidden])",type==="product"?productForm:brandForm)?.focus(),180);
}
function closeEditor(){
  editorPanel.classList.remove("open");editorScrim.classList.remove("open");editorPanel.setAttribute("aria-hidden","true");
  state.productFile=null;state.brandFile=null;if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl="";}
}
function fillProductForm(product){
  const fields=productForm.elements;
  fields.id.value=product?.id||"";fields.name.value=product?.name||"";fields.brandId.value=product?.brandId||sortedBrands()[0]?.id||"";
  fields.concentration.value=product?.concentration||"Eau de Parfum";fields.gender.value=product?.gender||"Unisex";
  fields.recommended.checked=!!product?.recommended;fields.outOfStock.checked=!!product?.outOfStock;
  fields.price1.value=product?.prices?.["1ml"]??"";fields.price2.value=product?.prices?.["2ml"]??"";fields.price3.value=product?.prices?.["3ml"]??"";fields.price5.value=product?.prices?.["5ml"]??"";
  fields.inspiredBy.value=product?.inspiredBy||"";fields.description.value=product?.description||"";
  fields.topNotes.value=(product?.topNotes||[]).join(", ");fields.heartNotes.value=(product?.heartNotes||[]).join(", ");fields.baseNotes.value=(product?.baseNotes||[]).join(", ");
  fields.longevity.value=product?.longevity||"Moderate (5–8 hours)";fields.projection.value=product?.projection||"Moderate";
  const path=product?.image||suggestedProductPath();$("#productImagePath").textContent=path;setPreview($("#productImagePreview"),path,null);
  $("#deleteProduct").hidden=!product;
}
function suggestedProductPath(){
  const brandId=productForm.elements.brandId.value||"brand";const name=productForm.elements.name.value||"product-name";
  return `images/products/${brandId}/${managerSlug(name)||"product-name"}.png`;
}
function editProduct(id=null){
  state.editingProductId=id;state.productFile=null;const product=id?productById(id):null;
  fillProductForm(product);openEditor("product",product?product.name:"Add fragrance",product?"Product editor":"New catalog entry");
}
function saveProduct(event){
  event.preventDefault();if(!productForm.reportValidity())return;
  const fields=productForm.elements,existing=state.editingProductId?productById(state.editingProductId):null;
  const brand=brandById(fields.brandId.value);if(!brand){toast("Choose a valid brand");return;}
  const id=existing.id||nextProductId(brand.id,fields.name.value);
  const image=state.productFile?suggestedProductPath():(existing?.image||suggestedProductPath());
  const product={
    ...(existing||{}),id,brandId:brand.id,brand:brand.name,name:fields.name.value.trim(),image,
    image2:existing?.image2||`images/products/${brand.id}/${managerSlug(fields.name.value)}-decant.png`,
    prices:{"1ml":Number(fields.price1.value),"2ml":Number(fields.price2.value),"3ml":Number(fields.price3.value),"5ml":Number(fields.price5.value)},
    concentration:fields.concentration.value.trim(),gender:fields.gender.value,description:fields.description.value.trim(),
    topNotes:noteList(fields.topNotes.value),heartNotes:noteList(fields.heartNotes.value),baseNotes:noteList(fields.baseNotes.value),
    longevity:fields.longevity.value.trim(),projection:fields.projection.value.trim(),inspiredBy:fields.inspiredBy.value.trim()||null,
    recommended:fields.recommended.checked,outOfStock:fields.outOfStock.checked
  };
  if(existing)state.products[state.products.indexOf(existing)]=product;else state.products.push(product);
  if(state.productFile)state.pendingAssets.set(image,state.productFile);
  persistDraft();renderAll();closeEditor();toast(`${product.name} saved to your draft`);
}
function deleteProduct(){
  const product=productById(state.editingProductId);if(!product)return;
  if(!confirm(`Delete ${product.name} from the catalog?`))return;
  state.products=state.products.filter(item=>item.id!==product.id);persistDraft();renderAll();closeEditor();toast(`${product.name} deleted`);
}

function fillBrandForm(brand){
  const fields=brandForm.elements;fields.originalId.value=brand?.id||"";fields.name.value=brand?.name||"";fields.id.value=brand?.id||"";
  fields.id.disabled=!!brand;
  const path=brand?.logo||`images/brands/${managerSlug(fields.name.value)||"brand-name"}.png`;
  $("#brandImagePath").textContent=path;setPreview($("#brandImagePreview"),path,null,true);
  const count=brand?state.products.filter(product=>product.brandId===brand.id).length:0;
  $("#deleteBrand").hidden=!brand;$("#deleteBrand").disabled=count>0;$("#deleteBrand").title=count?"Move or delete this brand's products first":"";
}
function editBrand(id=null){
  state.editingBrandId=id;state.brandFile=null;const brand=id?brandById(id):null;
  fillBrandForm(brand);openEditor("brand",brand?brand.name:"Add brand",brand?"Brand editor":"New fragrance house");
}
function saveBrand(event){
  event.preventDefault();if(!brandForm.reportValidity())return;
  const fields=brandForm.elements,existing=state.editingBrandId?brandById(state.editingBrandId):null;
  const id=existing?.id||managerSlug(fields.id.value||fields.name.value),name=fields.name.value.trim();
  if(!id||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)){toast("Use a lowercase, hyphenated brand ID");return;}
  if(!existing&&brandById(id)){toast("That brand ID already exists");return;}
  const logo=state.brandFile?`images/brands/${id}.png`:(existing?.logo||`images/brands/${id}.png`);
  const brand={id,name,logo};
  if(existing)state.brands[state.brands.indexOf(existing)]=brand;else state.brands.push(brand);
  state.products.filter(product=>product.brandId===id).forEach(product=>product.brand=name);
  if(state.brandFile)state.pendingAssets.set(logo,state.brandFile);
  persistDraft();renderAll();closeEditor();toast(`${name} saved to your draft`);
}
function deleteBrand(){
  const brand=brandById(state.editingBrandId);if(!brand)return;
  const count=state.products.filter(product=>product.brandId===brand.id).length;
  if(count){toast(`Move or delete ${count} products before deleting this brand`);return;}
  if(!confirm(`Delete ${brand.name} from the brand directory?`))return;
  state.brands=state.brands.filter(item=>item.id!==brand.id);persistDraft();renderAll();closeEditor();toast(`${brand.name} deleted`);
}

function validatePng(file){return file&&(/\.png$/i.test(file.name)||file.type==="image/png");}
function catalogPayload(){
  const brands=sortedBrands().map(brand=>({id:brand.id,name:brand.name,logo:brand.logo}));
  const brandMap=new Map(brands.map(brand=>[brand.id,brand.name]));
  const products=sortedProducts().filter(product=>brandMap.has(product.brandId)).map(product=>({...product,brand:brandMap.get(product.brandId),prices:Object.fromEntries(Object.entries(product.prices).map(([size,price])=>[size,Number(price)]))}));
  return{version:1,updatedAt:new Date().toISOString(),brands,products};
}
function validateCatalog(payload){
  const brandIds=new Set(),productIds=new Set();
  for(const brand of payload.brands){if(!brand.id||!brand.name||brandIds.has(brand.id))return`Invalid or duplicate brand: ${brand.name||brand.id}`;brandIds.add(brand.id);}
  for(const product of payload.products){
    if(!product.id||!product.name||productIds.has(product.id))return`Invalid or duplicate product: ${product.name||product.id}`;
    if(!brandIds.has(product.brandId))return`${product.name} has no valid brand`;
    if(!["1ml","2ml","3ml","5ml"].every(size=>Number.isFinite(product.prices[size])&&product.prices[size]>=0))return`${product.name} has invalid prices`;
    productIds.add(product.id);
  }
  return"";
}
function catalogSource(){
  const payload=catalogPayload();const error=validateCatalog(payload);if(error)throw new Error(error);
  return`/* Decant Dynasty managed catalog — generated by the local Catalog Manager.\n * Edit through catalog-manager.html; do not hand-edit this generated file.\n */\nglobalThis.DECANT_MANAGED_CATALOG = ${JSON.stringify(payload,null,2)};\n`;
}
function download(name,contents,type="text/javascript"){
  const url=URL.createObjectURL(new Blob([contents],{type}));const link=document.createElement("a");link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),500);
}
async function verifyStoreFolder(handle){
  try{await handle.getFileHandle("index.html");await handle.getFileHandle("app.js");return true;}catch(error){return false;}
}
async function connectFolder(){
  if(!("showDirectoryPicker" in window)){toast("Direct folder access requires Chrome or Edge on localhost");return false;}
  try{
    const handle=await showDirectoryPicker({id:"decant-dynasty-store",mode:"readwrite"});
    if(!await verifyStoreFolder(handle)){toast("Choose the store folder containing index.html");return false;}
    state.rootHandle=handle;$("#connectFolder").textContent="Store Folder Connected";$("#connectFolder").classList.add("connected");toast("Store folder connected securely for this session");return true;
  }catch(error){if(error.name!=="AbortError")toast("The store folder could not be opened");return false;}
}
async function writeFile(handle,name,contents){const fileHandle=await handle.getFileHandle(name,{create:true});const writable=await fileHandle.createWritable();await writable.write(contents);await writable.close();}
async function writeAsset(root,path,file){
  const parts=path.split("/");const filename=parts.pop();let directory=root;
  for(const part of parts)directory=await directory.getDirectoryHandle(part,{create:true});
  const fileHandle=await directory.getFileHandle(filename,{create:true});const writable=await fileHandle.createWritable();await writable.write(file);await writable.close();
}
async function saveToStorefront(){
  let sourceCode;try{sourceCode=catalogSource();}catch(error){toast(error.message);return;}
  if(!state.rootHandle&&"showDirectoryPicker" in window)await connectFolder();
  if(!state.rootHandle){$("#exportDialog").showModal();return;}
  const button=$("#publishCatalog");button.disabled=true;button.textContent="Saving…";
  try{
    await writeFile(state.rootHandle,"managed-catalog.js",sourceCode);
    for(const [path,file] of state.pendingAssets)await writeAsset(state.rootHandle,path,file);
    state.pendingAssets.clear();clearDraft();toast("Local storefront files updated — not yet published to GitHub");
  }catch(error){console.error(error);toast("Save failed. Reconnect the store folder and try again.");}
  finally{button.disabled=false;button.textContent="Save to Storefront";}
}

$$('[data-section]').forEach(button=>button.onclick=()=>showSection(button.dataset.section));
$("#productSearch").oninput=renderProducts;$("#brandFilter").onchange=renderProducts;$("#stockFilter").onchange=renderProducts;$("#brandSearch").oninput=renderBrands;
$("#productTable").onclick=event=>{const row=event.target.closest("[data-product-id]");if(row)editProduct(row.dataset.productId);};
$("#brandGrid").onclick=event=>{const card=event.target.closest("[data-brand-id]");if(card)editBrand(card.dataset.brandId);};
$("#addProduct").onclick=()=>editProduct();$("#addBrand").onclick=()=>editBrand();
$("#closeEditor").onclick=closeEditor;editorScrim.onclick=closeEditor;$("#cancelProduct").onclick=closeEditor;$("#cancelBrand").onclick=closeEditor;
productForm.onsubmit=saveProduct;brandForm.onsubmit=saveBrand;$("#deleteProduct").onclick=deleteProduct;$("#deleteBrand").onclick=deleteBrand;
productForm.elements.name.oninput=()=>{if(!state.editingProductId&&!state.productFile)$("#productImagePath").textContent=suggestedProductPath();};
productForm.elements.brandId.onchange=()=>{if(!state.editingProductId&&!state.productFile)$("#productImagePath").textContent=suggestedProductPath();};
brandForm.elements.name.oninput=()=>{if(!state.editingBrandId){brandForm.elements.id.value=managerSlug(brandForm.elements.name.value);$("#brandImagePath").textContent=`images/brands/${managerSlug(brandForm.elements.name.value)||"brand-name"}.png`;}};
productImageInput.onchange=()=>{const file=productImageInput.files[0];if(!file)return;if(!validatePng(file)){productImageInput.value="";toast("Product photos must be PNG files");return;}state.productFile=file;$("#productImagePath").textContent=suggestedProductPath();setPreview($("#productImagePreview"),"",file);};
brandImageInput.onchange=()=>{const file=brandImageInput.files[0];if(!file)return;if(!validatePng(file)){brandImageInput.value="";toast("Brand logos must be PNG files");return;}state.brandFile=file;const id=state.editingBrandId||managerSlug(brandForm.elements.id.value||brandForm.elements.name.value);$("#brandImagePath").textContent=`images/brands/${id||"brand-name"}.png`;setPreview($("#brandImagePreview"),"",file,true);};
$("#connectFolder").onclick=connectFolder;$("#publishCatalog").onclick=saveToStorefront;
$("#downloadCatalog").onclick=()=>{download("managed-catalog.js",catalogSource());toast("Catalog file downloaded — your draft remains until it is installed");};
const exportBackup=()=>download(`decant-dynasty-catalog-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(catalogPayload(),null,2),"application/json");
$("#downloadBackup").onclick=exportBackup;$("#exportBackup").onclick=exportBackup;
$("#importBackup").onchange=async event=>{
  const file=event.target.files[0];if(!file)return;
  try{
    const payload=JSON.parse(await file.text());const error=validateCatalog(payload);if(error)throw new Error(error);
    if(!confirm(`Import ${payload.products.length} products and ${payload.brands.length} brands? This replaces the current draft.`))return;
    state.brands=clone(payload.brands);state.products=clone(payload.products);state.pendingAssets.clear();persistDraft();renderAll();toast("Catalog backup imported into your draft");
  }catch(error){toast(`Backup could not be imported: ${error.message}`);}finally{event.target.value="";}
};
$$('[data-close-dialog]').forEach(button=>button.onclick=()=>$("#exportDialog").close());
document.addEventListener("keydown",event=>{if(event.key==="Escape"&&editorPanel.classList.contains("open"))closeEditor();});
window.addEventListener("beforeunload",event=>{if(state.dirty){event.preventDefault();event.returnValue="";}});

renderAll();showSection("products");
if(state.restored)setTimeout(()=>toast("Your unsaved local catalog draft was restored"),350);
})();
