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
const state={brands:clone(source.brands),products:clone(source.products),bundles:clone(Array.isArray(source.bundles)?source.bundles:globalThis.DECANT_DEFAULT_BUNDLES||[]),settings:{...(globalThis.DECANT_DEFAULT_SETTINGS||{}),...(source.settings||{})},section:"products",editingProductId:null,editingBrandId:null,editingBundleId:null,editingReviewId:null,productFile:null,brandFile:null,reviewFile:null,reviewPhotoRemoved:false,rootHandle:null,pendingAssets:new Map(),partnerPreviewUrls:new Map(),dirty:false,restored:false};
function normalizeSettings(){
  const combined=state.settings.paymentLogisticsImage||"";
  if(!Array.isArray(state.settings.paymentImages))state.settings.paymentImages=state.settings.paymentImage?[state.settings.paymentImage]:(combined?[combined]:[]);
  if(!Array.isArray(state.settings.logisticsImages))state.settings.logisticsImages=state.settings.logisticsImage?[state.settings.logisticsImage]:(combined?[combined]:[]);
  state.settings.paymentImages=[...new Set(state.settings.paymentImages.map(value=>String(value||"").trim()).filter(Boolean))];
  state.settings.logisticsImages=[...new Set(state.settings.logisticsImages.map(value=>String(value||"").trim()).filter(Boolean))];
  if(!Array.isArray(state.settings.reviews))state.settings.reviews=clone(globalThis.DECANT_DEFAULT_SETTINGS?.reviews||[]);
  state.settings.reviews=state.settings.reviews.filter(review=>review&&review.name&&review.text).map((review,index)=>({id:String(review.id||managerSlug(review.name)||`review-${index+1}`),name:String(review.name).trim(),text:String(review.text).trim(),photo:String(review.photo||"").trim()}));
  delete state.settings.paymentImage;delete state.settings.logisticsImage;delete state.settings.paymentLogisticsImage;
}
normalizeSettings();

try{
  const draft=JSON.parse(localStorage.getItem(DRAFT_KEY)||"null");
  if(draft?.version===1&&Array.isArray(draft.brands)&&Array.isArray(draft.products)){
    state.brands=draft.brands;state.products=draft.products;state.bundles=clone(Array.isArray(draft.bundles)?draft.bundles:state.bundles);state.settings={...state.settings,...(draft.settings||{})};state.dirty=true;state.restored=true;
  }
}catch(error){console.warn("Catalog draft could not be restored",error);}
normalizeSettings();

const productForm=$("#productForm");
const brandForm=$("#brandForm");
const bundleForm=$("#bundleForm");
const reviewForm=$("#reviewForm");
const editorPanel=$("#editorPanel");
const editorScrim=$("#editorScrim");
const productImageInput=$("#productImageInput");
const brandImageInput=$("#brandImageInput");
const reviewImageInput=$("#reviewImageInput");
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
  localStorage.setItem(DRAFT_KEY,JSON.stringify({version:1,updatedAt:new Date().toISOString(),brands:state.brands,products:state.products,bundles:state.bundles,settings:state.settings}));
  setSaveState();renderSummary();
}
function clearDraft(){state.dirty=false;localStorage.removeItem(DRAFT_KEY);setSaveState();}
function brandById(id){return state.brands.find(brand=>brand.id===id)||null;}
function productById(id){return state.products.find(product=>product.id===id)||null;}
function bundleById(id){return state.bundles.find(bundle=>bundle.id===id)||null;}
function reviewById(id){return (state.settings.reviews||[]).find(review=>review.id===id)||null;}
function sortedBrands(){return [...state.brands].sort((a,b)=>a.name.localeCompare(b.name));}
function sortedProducts(){return [...state.products].sort((a,b)=>a.brand.localeCompare(b.brand)||a.name.localeCompare(b.name));}
function nextProductId(brandId,name){
  const base=`${brandId}-managed-${managerSlug(name)||"fragrance"}`;let id=base,index=2;
  while(productById(id)){id=`${base}-${index++}`;}return id;
}
function setPreview(element,path,file,contain=false){
  if(element._previewUrl){URL.revokeObjectURL(element._previewUrl);element._previewUrl="";}
  const sourceUrl=file?(element._previewUrl=URL.createObjectURL(file)):path;
  element.innerHTML=sourceUrl?`<img src="${esc(sourceUrl)}" alt="" style="object-fit:${contain?'contain':'cover'}" />`:`<span>No photo</span>`;
}
function renderSummary(){
  const total=state.products.length,out=state.products.filter(product=>product.outOfStock).length,available=total-out;
  $("#sideProductCount").textContent=total;$("#sideBrandCount").textContent=state.brands.length;
  $("#sideBundleCount").textContent=state.bundles.length;
  $("#sideReviewCount").textContent=(state.settings.reviews||[]).length;
  $("#inventoryAvailable").textContent=`${available} available`;
  $("#inventoryStockText").textContent=`${out} product${out===1?"":"s"} out of stock`;
  $("#inventoryBar").style.width=`${total?available/total*100:0}%`;
}
function renderBrandOptions(){
  const options=sortedBrands().map(brand=>`<option value="${esc(brand.id)}">${esc(brand.name)}</option>`).join("");
  $("#brandFilter").innerHTML=`<option value="">All brands</option>${options}`;
  productForm.elements.brandId.innerHTML=options;
  bundleForm.elements.productIds.innerHTML=sortedProducts().map(product=>`<option value="${esc(product.id)}">${esc(product.brand)} — ${esc(product.name)}</option>`).join("");
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
function renderBundles(){
  $("#bundleGrid").innerHTML=state.bundles.length?state.bundles.slice().sort((a,b)=>a.name.localeCompare(b.name)).map(bundle=>`<button class="brand-manager-card" data-bundle-id="${esc(bundle.id)}"><span class="brand-manager-logo" style="display:grid;place-items:center;color:var(--gold);font-weight:800">${bundle.customizable?'YOU':(bundle.productIds||[]).length}</span><span><b>${esc(bundle.name)}</b><small>₱${Number(bundle.price||0).toLocaleString()} · ${esc(bundle.size||'2ml')} · ${bundle.active===false?'Hidden':'Live'}</small></span><i>↗</i></button>`).join(""):`<div class="table-empty">No discovery sets yet.</div>`;
}
function renderReviews(){
  const reviews=state.settings.reviews||[];
  $("#reviewGrid").innerHTML=reviews.length?reviews.map(review=>{
    const initial=esc((review.name||"?").trim()[0]||"?");
    const avatar=review.photo?`<img src="${esc(partnerPreviewSource(review.photo))}" alt="" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span hidden>${initial}</span>`:`<span>${initial}</span>`;
    return `<button class="brand-manager-card review-manager-card" data-review-id="${esc(review.id)}"><span class="brand-manager-logo review-manager-avatar">${avatar}</span><span><b>${esc(review.name)}</b><small>${esc(review.text)}</small></span><i>↗</i></button>`;
  }).join(""):`<div class="table-empty">No homepage reviews yet. Add one when you have a customer story to share.</div>`;
}
function renderSettings(){
  $("#analyticsMeasurementId").value=state.settings.analyticsMeasurementId||"";
  renderPartnerImages("payment");
  renderPartnerImages("logistics");
}
function partnerPreviewSource(path){
  const file=state.pendingAssets.get(path);if(!file)return path;
  if(!state.partnerPreviewUrls.has(path))state.partnerPreviewUrls.set(path,URL.createObjectURL(file));
  return state.partnerPreviewUrls.get(path);
}
function renderPartnerImages(type){
  const key=`${type}Images`,images=state.settings[key]||[],host=$(`#${type}MediaList`);
  if(!host)return;
  host.innerHTML=images.length?images.map(path=>`<article class="partner-media-card"><img src="${esc(partnerPreviewSource(path))}" alt="" /><span title="${esc(path)}">${esc(path.split("/").at(-1))}</span><button type="button" data-remove-partner="${type}" data-partner-path="${esc(path)}" aria-label="Remove image">×</button></article>`).join(""):`<div class="partner-media-empty">No ${type} logos yet. Add one or several PNG files.</div>`;
}
function nextPartnerPath(type,fileName){
  const existing=new Set([...(state.settings[`${type}Images`]||[]),...state.pendingAssets.keys()]);
  const base=managerSlug(String(fileName||"partner").replace(/\.png$/i,""))||"partner";
  let path=`images/partners/${type}/${base}.png`,index=2;
  while(existing.has(path))path=`images/partners/${type}/${base}-${index++}.png`;
  return path;
}
function addPartnerImages(type,fileList){
  const files=[...fileList];if(!files.length)return;
  const invalid=files.filter(file=>!validatePng(file));if(invalid.length){toast("Payment and logistics artwork must be PNG files");return;}
  const key=`${type}Images`;state.settings[key]=state.settings[key]||[];
  files.forEach(file=>{const path=nextPartnerPath(type,file.name);state.settings[key].push(path);state.pendingAssets.set(path,file);});
  persistDraft();renderSettings();toast(`${files.length} ${type} image${files.length===1?"":"s"} added to the draft`);
}
function removePartnerImage(type,path){
  const key=`${type}Images`;state.settings[key]=(state.settings[key]||[]).filter(source=>source!==path);state.pendingAssets.delete(path);
  if(state.partnerPreviewUrls.has(path)){URL.revokeObjectURL(state.partnerPreviewUrls.get(path));state.partnerPreviewUrls.delete(path);}
  persistDraft();renderSettings();
}
function renderAll(){renderSummary();renderBrandOptions();renderProducts();renderBrands();renderBundles();renderReviews();renderSettings();setSaveState();}

function showSection(section){
  state.section=section;
  $("#productsSection").hidden=section!=="products";$("#brandsSection").hidden=section!=="brands";$("#bundlesSection").hidden=section!=="bundles";$("#reviewsSection").hidden=section!=="reviews";$("#settingsSection").hidden=section!=="settings";
  $$("[data-section]").forEach(button=>button.classList.toggle("active",button.dataset.section===section));
}
function editorFormFor(type){return type==="product"?productForm:type==="brand"?brandForm:type==="bundle"?bundleForm:reviewForm;}
function openEditor(type,title,kicker){
  $("#editorTitle").textContent=title;$("#editorKicker").textContent=kicker;
  productForm.hidden=type!=="product";brandForm.hidden=type!=="brand";bundleForm.hidden=type!=="bundle";reviewForm.hidden=type!=="review";
  editorPanel.classList.add("open");editorScrim.classList.add("open");editorPanel.setAttribute("aria-hidden","false");
  setTimeout(()=>$("input:not([type=hidden])",editorFormFor(type))?.focus(),180);
}
function closeEditor(){
  editorPanel.classList.remove("open");editorScrim.classList.remove("open");editorPanel.setAttribute("aria-hidden","true");
  state.productFile=null;state.brandFile=null;state.reviewFile=null;state.reviewPhotoRemoved=false;
}
function fillProductForm(product){
  const fields=productForm.elements;
  fields.id.value=product?.id||"";fields.name.value=product?.name||"";fields.brandId.value=product?.brandId||sortedBrands()[0]?.id||"";
  fields.concentration.value=product?.concentration||"Eau de Parfum";fields.gender.value=product?.gender||"Unisex";
  fields.recommended.checked=!!product?.recommended;fields.outOfStock.checked=!!product?.outOfStock;
  fields.price1.value=product?.prices?.["1ml"]??"";fields.price2.value=product?.prices?.["2ml"]??"";fields.price3.value=product?.prices?.["3ml"]??"";fields.price5.value=product?.prices?.["5ml"]??"";
  fields.inspiredBy.value=product?.inspiredBy||"";fields.description.value=product?.description||"";
  fields.accords.value=(product?(globalThis.DECANT_ACCORDS?.derive(product)||["aromatic","woody","musky"]):["aromatic","woody","musky"]).join(", ");
  const researched=globalThis.DECANT_PRODUCT_PROFILES?.[product?.id]||{};
  fields.longevityScore.value=product?.longevityScore??researched.longevityScore??3;fields.projectionScore.value=product?.projectionScore??researched.projectionScore??3;
  fields.similarProductIds.value=(product?.similarProductIds||[]).join(", ");
  const path=product?.image||suggestedProductPath();$("#productImagePath").textContent=path;setPreview($("#productImagePreview"),path,null);
  $("#deleteProduct").hidden=!product;
}
function suggestedProductPath(){
  const brandId=productForm.elements.brandId.value||"brand";const name=productForm.elements.name.value||"product-name";
  return `images/products/${brandId}/${managerSlug(name)||"product-name"}.png`;
}
function validateEditorForm(form){
  const invalid=form.querySelector(":invalid");if(!invalid)return true;
  const label=invalid.closest(".field")?.querySelector("span")?.childNodes?.[0]?.textContent?.trim()||"the highlighted field";
  invalid.scrollIntoView({behavior:"smooth",block:"center"});invalid.focus();form.reportValidity();toast(`Please complete ${label}`);return false;
}
function editProduct(id=null){
  state.editingProductId=id;state.productFile=null;const product=id?productById(id):null;
  fillProductForm(product);openEditor("product",product?product.name:"Add fragrance",product?"Product editor":"New catalog entry");
}
function saveProduct(event){
  event.preventDefault();
  try{
    if(!validateEditorForm(productForm))return;
    const fields=productForm.elements,existing=state.editingProductId?productById(state.editingProductId):null;
    const brand=brandById(fields.brandId.value);if(!brand){toast("Choose a valid brand");return;}
    const id=existing?.id||nextProductId(brand.id,fields.name.value);
    const image=state.productFile?suggestedProductPath():(existing?.image||suggestedProductPath());
    const product={
      ...(existing||{}),id,brandId:brand.id,brand:brand.name,name:fields.name.value.trim(),image,
      image2:existing?.image2||`images/products/${brand.id}/${managerSlug(fields.name.value)}-decant.png`,
      prices:{"1ml":Number(fields.price1.value),"2ml":Number(fields.price2.value),"3ml":Number(fields.price3.value),"5ml":Number(fields.price5.value)},
      concentration:fields.concentration.value.trim(),gender:fields.gender.value,description:fields.description.value.trim(),
      topNotes:existing?.topNotes||[],heartNotes:existing?.heartNotes||[],baseNotes:existing?.baseNotes||[],
      longevity:existing?.longevity||"",projection:existing?.projection||"",inspiredBy:fields.inspiredBy.value.trim()||null,
      longevityScore:Number(fields.longevityScore.value)||3,projectionScore:Number(fields.projectionScore.value)||3,
      accords:noteList(fields.accords.value).map(accord=>globalThis.DECANT_ACCORDS?.normalize(accord)||accord.toLowerCase()),similarProductIds:noteList(fields.similarProductIds.value).filter(otherId=>otherId!==id),
      recommended:fields.recommended.checked,outOfStock:fields.outOfStock.checked
    };
    if(existing)state.products[state.products.indexOf(existing)]=product;else state.products.push(product);
    if(state.productFile)state.pendingAssets.set(image,state.productFile);
    persistDraft();renderAll();closeEditor();toast(`${product.name} added. Click Save to Storefront when ready.`);
  }catch(error){console.error("Product save failed",error);toast(`Product could not be saved: ${error.message}`);}
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
  event.preventDefault();
  try{
    if(!validateEditorForm(brandForm))return;
    const fields=brandForm.elements,existing=state.editingBrandId?brandById(state.editingBrandId):null;
    const id=existing?.id||managerSlug(fields.id.value||fields.name.value),name=fields.name.value.trim();
    if(!id||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)){toast("Use a lowercase, hyphenated brand ID");return;}
    if(!existing&&brandById(id)){toast("That brand ID already exists");return;}
    const logo=state.brandFile?`images/brands/${id}.png`:(existing?.logo||`images/brands/${id}.png`);
    const brand={id,name,logo};
    if(existing)state.brands[state.brands.indexOf(existing)]=brand;else state.brands.push(brand);
    state.products.filter(product=>product.brandId===id).forEach(product=>product.brand=name);
    if(state.brandFile)state.pendingAssets.set(logo,state.brandFile);
    persistDraft();renderAll();closeEditor();toast(`${name} added. Click Save to Storefront when ready.`);
  }catch(error){console.error("Brand save failed",error);toast(`Brand could not be saved: ${error.message}`);}
}
function deleteBrand(){
  const brand=brandById(state.editingBrandId);if(!brand)return;
  const count=state.products.filter(product=>product.brandId===brand.id).length;
  if(count){toast(`Move or delete ${count} products before deleting this brand`);return;}
  if(!confirm(`Delete ${brand.name} from the brand directory?`))return;
  state.brands=state.brands.filter(item=>item.id!==brand.id);persistDraft();renderAll();closeEditor();toast(`${brand.name} deleted`);
}

function fillBundleForm(bundle){
  const fields=bundleForm.elements;fields.name.value=bundle?.name||"";fields.id.value=bundle?.id||"";fields.id.disabled=!!bundle;fields.description.value=bundle?.description||"";fields.price.value=bundle?.price??"";fields.size.value=bundle?.size||"2ml";fields.customizable.checked=!!bundle?.customizable;fields.active.checked=bundle?.active!==false;fields.selectionCount.value=bundle?.selectionCount||4;
  const chosen=new Set(bundle?.productIds||[]);[...fields.productIds.options].forEach(option=>option.selected=chosen.has(option.value));$("#deleteBundle").hidden=!bundle;
}
function editBundle(id=null){state.editingBundleId=id;const bundle=id?bundleById(id):null;fillBundleForm(bundle);openEditor("bundle",bundle?bundle.name:"Add bundle",bundle?"Bundle editor":"New discovery set");}
function saveBundle(event){
  event.preventDefault();if(!validateEditorForm(bundleForm))return;
  const fields=bundleForm.elements,existing=state.editingBundleId?bundleById(state.editingBundleId):null,id=existing?.id||managerSlug(fields.id.value||fields.name.value),name=fields.name.value.trim();
  if(!id||(!existing&&bundleById(id))){toast("Choose a unique bundle ID");return;}
  const bundle={...(existing||{}),id,name,description:fields.description.value.trim(),price:Number(fields.price.value),size:fields.size.value,productIds:[...fields.productIds.selectedOptions].map(option=>option.value),customizable:fields.customizable.checked,selectionCount:Number(fields.selectionCount.value)||4,active:fields.active.checked};
  if(!bundle.customizable&&!bundle.productIds.length){toast("Choose at least one fragrance for this set");return;}
  if(existing)state.bundles[state.bundles.indexOf(existing)]=bundle;else state.bundles.push(bundle);persistDraft();renderAll();closeEditor();toast(`${bundle.name} saved. Click Save to Storefront when ready.`);
}
function deleteBundle(){const bundle=bundleById(state.editingBundleId);if(!bundle)return;if(!confirm(`Delete ${bundle.name}?`))return;state.bundles=state.bundles.filter(item=>item.id!==bundle.id);persistDraft();renderAll();closeEditor();toast(`${bundle.name} deleted`);}

function nextReviewId(name){
  const base=managerSlug(name)||"customer-review";let id=base,index=2;
  while(reviewById(id))id=`${base}-${index++}`;
  return id;
}
function reviewImageExtension(file){
  const named=/\.(png|jpe?g|webp)$/i.exec(file?.name||"")?.[1]?.toLowerCase();
  if(named)return named==="jpeg"?"jpg":named;
  return file?.type==="image/png"?"png":file?.type==="image/webp"?"webp":"jpg";
}
function suggestedReviewPath(id,file=state.reviewFile){return `images/reviews/${id}.${reviewImageExtension(file)}`;}
function fillReviewForm(review){
  const fields=reviewForm.elements;fields.id.value=review?.id||"";fields.name.value=review?.name||"";fields.text.value=review?.text||"";
  const path=review?.photo||"";$("#reviewImagePath").textContent=path||"No photo selected.";setPreview($("#reviewImagePreview"),path,null);$("#deleteReview").hidden=!review;$("#removeReviewImage").hidden=!path;
}
function editReview(id=null){
  state.editingReviewId=id;state.reviewFile=null;state.reviewPhotoRemoved=false;const review=id?reviewById(id):null;
  fillReviewForm(review);openEditor("review",review?review.name:"Add review",review?"Homepage review editor":"New customer story");
}
function saveReview(event){
  event.preventDefault();if(!validateEditorForm(reviewForm))return;
  const fields=reviewForm.elements,existing=state.editingReviewId?reviewById(state.editingReviewId):null,name=fields.name.value.trim(),id=existing?.id||nextReviewId(name);
  const photo=state.reviewFile?suggestedReviewPath(id):state.reviewPhotoRemoved?"":existing?.photo||"";
  const review={id,name,text:fields.text.value.trim(),photo};
  if(existing)state.settings.reviews[state.settings.reviews.indexOf(existing)]=review;else state.settings.reviews.push(review);
  if(state.reviewFile)state.pendingAssets.set(photo,state.reviewFile);
  persistDraft();renderAll();closeEditor();toast(`${review.name}'s review saved. Click Save to Storefront when ready.`);
}
function deleteReview(){
  const review=reviewById(state.editingReviewId);if(!review)return;if(!confirm(`Delete ${review.name}'s review?`))return;
  state.settings.reviews=state.settings.reviews.filter(item=>item.id!==review.id);persistDraft();renderAll();closeEditor();toast(`${review.name}'s review deleted`);
}
function removeReviewImage(){
  state.reviewFile=null;state.reviewPhotoRemoved=true;reviewImageInput.value="";$("#reviewImagePath").textContent="No photo selected.";setPreview($("#reviewImagePreview"),"",null);$("#removeReviewImage").hidden=true;
}
function saveSettings(){
  const measurementId=$("#analyticsMeasurementId").value.trim().toUpperCase();if(measurementId&&!/^G-[A-Z0-9]+$/.test(measurementId)){toast("Use a GA4 ID beginning with G-");return;}
  state.settings.analyticsMeasurementId=measurementId;
  normalizeSettings();persistDraft();renderSettings();toast("Storefront settings saved to your draft");
}

function validatePng(file){return file&&(/\.png$/i.test(file.name)||file.type==="image/png");}
function validateReviewImage(file){return file&&(/\.(png|jpe?g|webp)$/i.test(file.name)||["image/png","image/jpeg","image/webp"].includes(file.type));}
function catalogPayload(){
  const brands=sortedBrands().map(brand=>({id:brand.id,name:brand.name,logo:brand.logo}));
  const brandMap=new Map(brands.map(brand=>[brand.id,brand.name]));
  const products=sortedProducts().filter(product=>brandMap.has(product.brandId)).map(product=>({...product,brand:brandMap.get(product.brandId),prices:Object.fromEntries(Object.entries(product.prices).map(([size,price])=>[size,Number(price)]))}));
  return{version:1,updatedAt:new Date().toISOString(),brands,products,bundles:clone(state.bundles),settings:{...state.settings}};
}
function validateCatalog(payload){
  const brandIds=new Set(),productIds=new Set();
  for(const brand of payload.brands){if(!brand.id||!brand.name||brandIds.has(brand.id))return`Invalid or duplicate brand: ${brand.name||brand.id}`;brandIds.add(brand.id);}
  for(const product of payload.products){
    if(!product.id||!product.name||productIds.has(product.id))return`Invalid or duplicate product: ${product.name||product.id}`;
    if(!brandIds.has(product.brandId))return`${product.name} has no valid brand`;
    if(!["1ml","2ml","3ml","5ml"].every(size=>Number.isFinite(product.prices[size])&&product.prices[size]>=0))return`${product.name} has invalid prices`;
    if(!(globalThis.DECANT_ACCORDS?.derive(product)||[]).length)return`${product.name} needs at least one main accord`;
    productIds.add(product.id);
  }
  const bundleIds=new Set();
  for(const bundle of payload.bundles||[]){
    if(!bundle.id||!bundle.name||bundleIds.has(bundle.id))return`Invalid or duplicate bundle: ${bundle.name||bundle.id}`;
    if(!Number.isFinite(Number(bundle.price))||Number(bundle.price)<0)return`${bundle.name} has an invalid price`;
    if(!bundle.customizable&&!(bundle.productIds||[]).length)return`${bundle.name} needs at least one fragrance`;
    if((bundle.productIds||[]).some(id=>!productIds.has(id)))return`${bundle.name} includes a missing fragrance`;
    bundleIds.add(bundle.id);
  }
  const reviewIds=new Set();
  for(const review of payload.settings?.reviews||[]){
    if(!review.id||!review.name||!review.text||reviewIds.has(review.id))return`Invalid or duplicate review: ${review.name||review.id||"Unnamed review"}`;
    reviewIds.add(review.id);
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
$("#bundleGrid").onclick=event=>{const card=event.target.closest("[data-bundle-id]");if(card)editBundle(card.dataset.bundleId);};
$("#reviewGrid").onclick=event=>{const card=event.target.closest("[data-review-id]");if(card)editReview(card.dataset.reviewId);};
$("#addProduct").onclick=()=>editProduct();$("#addBrand").onclick=()=>editBrand();$("#addBundle").onclick=()=>editBundle();$("#addReview").onclick=()=>editReview();
$("#closeEditor").onclick=closeEditor;editorScrim.onclick=closeEditor;$("#cancelProduct").onclick=closeEditor;$("#cancelBrand").onclick=closeEditor;$("#cancelBundle").onclick=closeEditor;$("#cancelReview").onclick=closeEditor;
productForm.onsubmit=saveProduct;brandForm.onsubmit=saveBrand;bundleForm.onsubmit=saveBundle;reviewForm.onsubmit=saveReview;$("#deleteProduct").onclick=deleteProduct;$("#deleteBrand").onclick=deleteBrand;$("#deleteBundle").onclick=deleteBundle;$("#deleteReview").onclick=deleteReview;
productForm.elements.name.oninput=()=>{if(!state.editingProductId&&!state.productFile)$("#productImagePath").textContent=suggestedProductPath();};
productForm.elements.brandId.onchange=()=>{if(!state.editingProductId&&!state.productFile)$("#productImagePath").textContent=suggestedProductPath();};
brandForm.elements.name.oninput=()=>{if(!state.editingBrandId){brandForm.elements.id.value=managerSlug(brandForm.elements.name.value);$("#brandImagePath").textContent=`images/brands/${managerSlug(brandForm.elements.name.value)||"brand-name"}.png`;}};
productImageInput.onchange=()=>{const file=productImageInput.files[0];if(!file)return;if(!validatePng(file)){productImageInput.value="";toast("Product photos must be PNG files");return;}state.productFile=file;$("#productImagePath").textContent=suggestedProductPath();setPreview($("#productImagePreview"),"",file);};
brandImageInput.onchange=()=>{const file=brandImageInput.files[0];if(!file)return;if(!validatePng(file)){brandImageInput.value="";toast("Brand logos must be PNG files");return;}state.brandFile=file;const id=state.editingBrandId||managerSlug(brandForm.elements.id.value||brandForm.elements.name.value);$("#brandImagePath").textContent=`images/brands/${id||"brand-name"}.png`;setPreview($("#brandImagePreview"),"",file,true);};
reviewForm.elements.name.oninput=()=>{if(!state.editingReviewId&&state.reviewFile)$("#reviewImagePath").textContent=suggestedReviewPath(managerSlug(reviewForm.elements.name.value)||"customer-review");};
reviewImageInput.onchange=()=>{const file=reviewImageInput.files[0];if(!file)return;if(!validateReviewImage(file)){reviewImageInput.value="";toast("Review photos must be PNG, JPG, or WebP files");return;}state.reviewFile=file;state.reviewPhotoRemoved=false;const id=state.editingReviewId||managerSlug(reviewForm.elements.name.value)||"customer-review";$("#reviewImagePath").textContent=suggestedReviewPath(id,file);setPreview($("#reviewImagePreview"),"",file);$("#removeReviewImage").hidden=false;};
$("#removeReviewImage").onclick=removeReviewImage;
$("#paymentMediaInput").onchange=event=>{addPartnerImages("payment",event.target.files);event.target.value="";};
$("#logisticsMediaInput").onchange=event=>{addPartnerImages("logistics",event.target.files);event.target.value="";};
$("#settingsSection").onclick=event=>{const button=event.target.closest("[data-remove-partner]");if(button)removePartnerImage(button.dataset.removePartner,button.dataset.partnerPath);};
$("#saveSettings").onclick=saveSettings;
$("#connectFolder").onclick=connectFolder;$("#publishCatalog").onclick=saveToStorefront;
$("#downloadCatalog").onclick=()=>{download("managed-catalog.js",catalogSource());toast("Catalog file downloaded — your draft remains until it is installed");};
const exportBackup=()=>download(`decant-dynasty-catalog-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(catalogPayload(),null,2),"application/json");
$("#downloadBackup").onclick=exportBackup;$("#exportBackup").onclick=exportBackup;
$("#importBackup").onchange=async event=>{
  const file=event.target.files[0];if(!file)return;
  try{
    const payload=JSON.parse(await file.text());const error=validateCatalog(payload);if(error)throw new Error(error);
    if(!confirm(`Import ${payload.products.length} products and ${payload.brands.length} brands? This replaces the current draft.`))return;
    state.brands=clone(payload.brands);state.products=clone(payload.products);state.bundles=clone(Array.isArray(payload.bundles)?payload.bundles:state.bundles);state.settings={...state.settings,...(payload.settings||{})};normalizeSettings();state.pendingAssets.clear();persistDraft();renderAll();toast("Catalog backup imported into your draft");
  }catch(error){toast(`Backup could not be imported: ${error.message}`);}finally{event.target.value="";}
};
$$('[data-close-dialog]').forEach(button=>button.onclick=()=>$("#exportDialog").close());
document.addEventListener("keydown",event=>{if(event.key==="Escape"&&editorPanel.classList.contains("open"))closeEditor();});
window.addEventListener("beforeunload",event=>{if(state.dirty){event.preventDefault();event.returnValue="";}});

renderAll();showSection("products");
if(state.restored)setTimeout(()=>toast("Your unsaved local catalog draft was restored"),350);
})();
