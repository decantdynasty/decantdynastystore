/*
 * Decant Dynasty main-accord engine.
 *
 * Product note pyramids remain in the managed catalog as research data, but the
 * storefront presents Fragrantica-style main accords. An explicit `accords`
 * array entered in Catalog Manager always wins over the derived profile.
 */
(function(){
"use strict";

const ACCORDS = [
  {name:"citrus",color:"#e9c83f",ink:"#251d00",terms:/bergamot|lemon|lime|citron|orange|mandarin|tangerine|grapefruit|yuzu|citrus|chinotto|verbena|verbana|petitgrain|lemongrass/},
  {name:"woody",color:"#8a6041",ink:"#fff7ed",terms:/wood|cedar|sandalwood|vetiver|oud|akigalawood|cashmeran|georgywood|papyrus|driftwood|oak\b|birch|patchouli/},
  {name:"aromatic",color:"#6c916f",ink:"#f4fff5",terms:/lavender|rosemary|sage|basil|thyme|eucalyptus|juniper|mint|spearmint|herbal|wormwood|clary|geranium|cypress/},
  {name:"fresh spicy",color:"#87a65c",ink:"#14200d",terms:/ginger|pepper|cardamom|coriander|elemi|nutmeg|juniper|aromatic spices/},
  {name:"warm spicy",color:"#bd6636",ink:"#fff7ef",terms:/cinnamon|clove|spices|saffron|cumin|caraway|star anise|anise|turmeric|ginger|cardamom|nutmeg/},
  {name:"cinnamon",color:"#a9552b",ink:"#fff8f0",terms:/cinnamon/},
  {name:"floral",color:"#d98aa6",ink:"#2b0f19",terms:/flower|floral|peony|violet|freesia|magnolia|ylang|cyclamen|mimosa|orchid|lotus|lily|petalia|mahonial|honeysuckle|lavender|geranium/},
  {name:"white floral",color:"#f2e8c9",ink:"#2a2415",terms:/jasmine|tuberose|orange blossom|white flower|white blossom|gardenia|neroli|lily-of-the-valley|ylang/},
  {name:"rose",color:"#c95c72",ink:"#fff7f9",terms:/rose\b/},
  {name:"fruity",color:"#b64d62",ink:"#fff7f9",terms:/apple|pear|berry|berries|black currant|red currant|currant|peach|plum|litchi|lychee|pineapple|melon|watermelon|raspberry|cherry|apricot|grape|fruits|rhubarb|mirabelle|fig\b|acai/},
  {name:"tropical",color:"#e38d3d",ink:"#2b1703",terms:/mango|coconut|passionfruit|dragon fruit|tropical|pineapple/},
  {name:"green",color:"#4f8a52",ink:"#f4fff2",terms:/green notes|green accord|green leaves|fig leaf|galbanum|violet leaf|mastic|aloe vera|cucumber|basil|mint/},
  {name:"aquatic",color:"#4a9ec4",ink:"#f5fdff",terms:/aquatic|water notes|watery|marine|sea notes|sea accord|calone|aquozone|seaweed|coconut water|tonic water/},
  {name:"ozonic",color:"#8ab8d0",ink:"#132631",terms:/ozonic|aquozone|snow|ice\b|mineral notes/},
  {name:"fresh",color:"#80bfb0",ink:"#10251f",terms:/mint|spearmint|cucumber|aloe vera|water notes|marine|sea notes|aquatic|ozonic|snow|ice\b|citrus/},
  {name:"sweet",color:"#d8879e",ink:"#2d1018",terms:/vanilla|tonka|caramel|praline|honey|sugar|marshmallow|cotton candy|toffee|maltol|dulce de leche|candy|chocolate|cacao|cream|milk|cheesecake|bubble gum|dates|candied fruits|pistachio|hazelnut|almond|gourmand/},
  {name:"vanilla",color:"#e4d2a2",ink:"#332816",terms:/vanilla/},
  {name:"powdery",color:"#b7a0c8",ink:"#23162d",terms:/iris|orris|violet|heliotrope|powder|ambrette|carrot seed/},
  {name:"amber",color:"#c07a35",ink:"#fff8ee",terms:/amber|ambroxan|ambrofix|ambergris|amergris|benzoin|labdanum|opoponax|myrrh|resin|olibanum|frankincense/},
  {name:"musky",color:"#a8a19b",ink:"#201d1a",terms:/musk|ambrette/},
  {name:"balsamic",color:"#835637",ink:"#fff8ef",terms:/benzoin|labdanum|opoponax|myrrh|resin|olibanum|frankincense|incense|styrax|fir resin/},
  {name:"smoky",color:"#55575b",ink:"#ffffff",terms:/smoke|smoky|incense|birch|olibanum|frankincense/},
  {name:"leather",color:"#624637",ink:"#fff8f1",terms:/leather|suede|birch/},
  {name:"earthy",color:"#6f6248",ink:"#fffaf0",terms:/patchouli|oakmoss|moss|earth|vetiver/},
  {name:"gourmand",color:"#a9663d",ink:"#fff8ef",terms:/gourmand|caramel|praline|toffee|cacao|chocolate|cream|milk|marshmallow|cotton candy|cheesecake|dulce de leche|honey|coffee|pistachio|hazelnut|almond|bubble gum|ice cream/},
  {name:"lactonic",color:"#e5d7bd",ink:"#30271d",terms:/milk|cream|lactonic|cheesecake|ice cream|butter/},
  {name:"caramel",color:"#b56e35",ink:"#fff8ee",terms:/caramel|toffee|praline|dulce de leche|crème brûlée/},
  {name:"coffee",color:"#65483a",ink:"#fff8ef",terms:/coffee/},
  {name:"cacao",color:"#5d3b2c",ink:"#fff8ee",terms:/cacao|chocolate|fudge/},
  {name:"tobacco",color:"#795139",ink:"#fff8ef",terms:/tobacco/},
  {name:"boozy",color:"#8d4855",ink:"#fff7f8",terms:/rum|cognac|vodka|whisky|whiskey|baileys/},
  {name:"nutty",color:"#a87b4d",ink:"#24180c",terms:/almond|pistachio|hazelnut|chestnut/},
  {name:"animalic",color:"#64554c",ink:"#fff8f3",terms:/civet|animalic|leather/},
  {name:"salty",color:"#91b2b8",ink:"#142326",terms:/sea salt|salt\b/}
];

const BY_NAME = new Map(ACCORDS.map(accord=>[accord.name,accord]));
const DIRECT_BOOSTS = {
  aquatic:{pattern:/aquatic|water notes|watery|marine|sea notes|sea accord|calone|aquozone/,factor:2.15},
  cinnamon:{pattern:/cinnamon/,factor:1.65},
  coffee:{pattern:/coffee/,factor:1.45},
  cacao:{pattern:/cacao|chocolate|fudge/,factor:1.35},
  tobacco:{pattern:/tobacco/,factor:1.35},
  leather:{pattern:/leather|suede/,factor:1.3},
  rose:{pattern:/rose\b/,factor:1.2},
  vanilla:{pattern:/vanilla/,factor:1.15}
};
const ALIASES = new Map([
  ["spicy","warm spicy"],["fresh spice","fresh spicy"],["warm spice","warm spicy"],
  ["woods","woody"],["wood","woody"],["musk","musky"],["fruit","fruity"],
  ["flowers","floral"],["aqua","aquatic"],["marine","aquatic"]
]);

function normalize(value){
  const name=String(value||"").trim().toLowerCase().replace(/\s+/g," ");
  return ALIASES.get(name)||name;
}
function meta(value){
  const name=normalize(value),known=BY_NAME.get(name);
  return known?{name:known.name,color:known.color,ink:known.ink}:{name:name||"balanced",color:"#9a8460",ink:"#fffaf2"};
}
function explicitAccords(product){
  const source=Array.isArray(product?.accords)&&product.accords.length?product.accords:Array.isArray(product?.scentFamilies)&&product.scentFamilies.length?product.scentFamilies:[];
  return [...new Set(source.map(normalize).filter(Boolean))].slice(0,7);
}
function derive(product){
  const explicit=explicitAccords(product);if(explicit.length)return explicit;
  const scored=new Map();
  const layers=[
    {notes:product?.topNotes||[],weight:1.08},
    {notes:product?.heartNotes||[],weight:1.12},
    {notes:product?.baseNotes||[],weight:1.18}
  ];
  for(const {notes,weight} of layers){
    for(const raw of notes){
      const note=String(raw||"").toLowerCase();
      for(const accord of ACCORDS){
        accord.terms.lastIndex=0;
        if(accord.terms.test(note)){
          const boost=DIRECT_BOOSTS[accord.name];
          const contribution=weight*(boost?.pattern.test(note)?boost.factor:1);
          scored.set(accord.name,(scored.get(accord.name)||0)+contribution);
        }
      }
    }
  }
  const context=`${product?.name||""} ${product?.description||""}`.toLowerCase();
  for(const accord of ACCORDS){accord.terms.lastIndex=0;if(accord.terms.test(context))scored.set(accord.name,(scored.get(accord.name)||0)+.38);}
  const suppress=(specific,generic,ratio=.72)=>{
    if(scored.has(specific)&&scored.has(generic))scored.set(generic,scored.get(generic)*ratio);
  };
  suppress("white floral","floral",.8);suppress("rose","floral",.78);suppress("tropical","fruity",.9);
  suppress("vanilla","sweet",.92);suppress("caramel","sweet",.88);suppress("gourmand","sweet",.92);
  const ordered=[...scored].sort((a,b)=>b[1]-a[1]||ACCORDS.findIndex(x=>x.name===a[0])-ACCORDS.findIndex(x=>x.name===b[0])).map(entry=>entry[0]);
  return (ordered.length?ordered:["aromatic","woody","musky"]).slice(0,7);
}

globalThis.DECANT_ACCORDS={derive,meta,normalize,all:ACCORDS.map(({name,color,ink})=>({name,color,ink}))};
})();
