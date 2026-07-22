(function(){
  "use strict";
  const STORAGE_KEY="dd:analytics:local:v1";
  const managed=globalThis.DECANT_MANAGED_CATALOG||{};
  const defaults=globalThis.DECANT_DEFAULT_SETTINGS||{};
  const settings={...defaults,...(managed.settings||{})};
  let local={events:{},searches:{},noResults:{},products:{},comparisons:{}};
  try{local={...local,...JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}")};}catch(e){}
  const save=()=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(local));}catch(e){}};
  const bump=(bucket,key)=>{if(!key)return;local[bucket]??={};local[bucket][key]=(local[bucket][key]||0)+1;};
  const measurementId=String(settings.analyticsMeasurementId||"").trim();
  if(/^G-[A-Z0-9]+$/i.test(measurementId)){
    globalThis.dataLayer=globalThis.dataLayer||[];
    globalThis.gtag=globalThis.gtag||function(){dataLayer.push(arguments);};
    gtag("js",new Date());gtag("config",measurementId,{send_page_view:false});
    const script=document.createElement("script");script.async=true;script.src=`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;document.head.append(script);
  }
  function track(name,params={}){
    bump("events",name);
    if(name==="search")bump("searches",String(params.search_term||"").toLowerCase());
    if(name==="search_no_results")bump("noResults",String(params.search_term||"").toLowerCase());
    if(name==="view_item")bump("products",params.item_id);
    if(name==="compare_products")bump("comparisons",[...(params.item_ids||[])].sort().join(" + "));
    save();
    if(globalThis.gtag)gtag("event",name,params);
  }
  globalThis.DDAnalytics={track,getLocalSummary:()=>JSON.parse(JSON.stringify(local)),settings};
})();
