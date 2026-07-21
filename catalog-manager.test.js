const fs=require("fs");
const vm=require("vm");
const assert=require("assert");

function loadCatalog(){
  const context=vm.createContext({globalThis:{},console,module:{exports:{}}});
  for(const file of ["prices.js","data.js","catalog-research.js"]){
    vm.runInContext(fs.readFileSync(file,"utf8"),context,{filename:file});
  }
  const catalog=JSON.parse(vm.runInContext("JSON.stringify({brands:BRANDS,products:PRODUCTS})",context));
  return{context,catalog};
}

const {context,catalog}=loadCatalog();
assert.equal(catalog.brands.length,28,"Expected all brands");
assert.equal(catalog.products.length,154,"Expected all products");

const brandIds=new Set();
for(const brand of catalog.brands){
  assert(brand.id&&brand.name&&brand.logo,`Invalid brand: ${brand.name||brand.id}`);
  assert(!brandIds.has(brand.id),`Duplicate brand ID: ${brand.id}`);
  assert(brand.logo.endsWith(".png"),`Brand logo must be PNG: ${brand.name}`);
  brandIds.add(brand.id);
}

const productIds=new Set();
for(const product of catalog.products){
  assert(product.id&&product.name,`Invalid product: ${product.id}`);
  assert(!productIds.has(product.id),`Duplicate product ID: ${product.id}`);
  assert(brandIds.has(product.brandId),`Unknown brand for ${product.name}`);
  assert(["1ml","2ml","3ml","5ml"].every(size=>Number.isFinite(product.prices[size])&&product.prices[size]>=0),`Invalid prices for ${product.name}`);
  assert([product.topNotes,product.heartNotes,product.baseNotes].every(Array.isArray),`Invalid notes for ${product.name}`);
  assert(product.image.endsWith(".png"),`Product image must be PNG: ${product.name}`);
  productIds.add(product.id);
}

const managed={version:1,brands:catalog.brands,products:catalog.products.map((product,index)=>index?product:{...product,prices:{...product.prices,"1ml":777}})};
context.globalThis.DECANT_MANAGED_CATALOG=managed;
vm.runInContext(`
  (function(){
    const managed=globalThis.DECANT_MANAGED_CATALOG;
    const brands=managed.brands.filter(brand=>brand&&brand.id&&brand.name&&brand.logo);
    const brandMap=new Map(brands.map(brand=>[brand.id,brand]));
    const products=managed.products.filter(product=>{
      const prices=product?.prices;
      return product?.id&&product?.name&&brandMap.has(product.brandId)&&prices&&["1ml","2ml","3ml","5ml"].every(size=>Number.isFinite(Number(prices[size]))&&Number(prices[size])>=0);
    }).map(product=>({...product,brand:brandMap.get(product.brandId).name,prices:Object.fromEntries(Object.entries(product.prices).map(([size,price])=>[size,Number(price)]))}));
    BRANDS.splice(0,BRANDS.length,...brands);
    PRODUCTS.splice(0,PRODUCTS.length,...products);
  })();
`,context);

const applied=JSON.parse(vm.runInContext("JSON.stringify({brands:BRANDS.length,products:PRODUCTS.length,price:PRODUCTS[0].prices['1ml']})",context));
assert.deepEqual(applied,{brands:28,products:154,price:777},"Managed catalog override was not applied");

console.log(`Catalog manager data checks passed: ${catalog.brands.length} brands, ${catalog.products.length} products, ${catalog.products.filter(product=>product.outOfStock).length} out of stock.`);
