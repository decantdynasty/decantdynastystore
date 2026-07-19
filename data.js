// ============================================================
// DECANT DYNASTY — DATA LAYER
// Strongly-typed shape (documented, JS-runtime):
//
// interface PriceMap { "1ml": number; "2ml": number; "3ml": number; "5ml": number; }
// interface Product {
//   id: string; brandId: string; brand: string; name: string; image: string;
//   prices: PriceMap; concentration: string; gender: "Men"|"Women"|"Unisex";
//   description: string; topNotes: string[]; heartNotes: string[]; baseNotes: string[];
//   longevity: string; projection: string; inspiredBy: string|null; recommended: boolean;
// }
// interface Brand { id: string; name: string; logo: string; }
// ============================================================

const BRANDS = [
  { id: "afnan", name: "Afnan", logo: "images/brands/afnan.png" },
  { id: "ahmed-al-maghribi", name: "Ahmed Al Maghribi", logo: "images/brands/ahmed-al-maghribi.png" },
  { id: "al-haramain", name: "Al Haramain", logo: "images/brands/al-haramain.png" },
  { id: "al-wataniah", name: "Al Wataniah", logo: "images/brands/al-wataniah.png" },
  { id: "arabiyat-prestige", name: "Arabiyat Prestige", logo: "images/brands/arabiyat-prestige.png" },
  { id: "armaf", name: "Armaf", logo: "images/brands/armaf.png" },
  { id: "asdaaf", name: "Asdaaf", logo: "images/brands/asdaaf.png" },
  { id: "azzaro", name: "Azzaro", logo: "images/brands/azzaro.png" },
  { id: "bujairami", name: "Bujairami", logo: "images/brands/bujairami.png" },
  { id: "calvin-klein", name: "Calvin Klein", logo: "images/brands/calvin-klein.png" },
  { id: "fragrance-world", name: "Fragrance World", logo: "images/brands/fragrance-world.png" },
  { id: "french-avenue", name: "French Avenue", logo: "images/brands/french-avenue.png" },
  { id: "giorgio-armani", name: "Giorgio Armani", logo: "images/brands/giorgio-armani.png" },
  { id: "jpg", name: "Jean Paul Gaultier", logo: "images/brands/jpg.png" },
  { id: "khadlaj", name: "Khadlaj", logo: "images/brands/khadlaj.png" },
  { id: "lattafa", name: "Lattafa", logo: "images/brands/lattafa.png" },
  { id: "maison-alhambra", name: "Maison Alhambra", logo: "images/brands/maison-alhambra.png" },
  { id: "maison-asrar", name: "Maison Asrar", logo: "images/brands/maison-asrar.png" },
  { id: "montblanc", name: "Montblanc", logo: "images/brands/montblanc.png" },
  { id: "nautica", name: "Nautica", logo: "images/brands/nautica.png" },
  { id: "paris-corner", name: "Paris Corner", logo: "images/brands/paris-corner.png" },
  { id: "rasasi", name: "Rasasi", logo: "images/brands/rasasi.png" },
  { id: "rayhaan", name: "Rayhaan", logo: "images/brands/rayhaan.png" },
  { id: "riiffs", name: "Riiffs", logo: "images/brands/riiffs.png" },
  { id: "tubbees", name: "Tubbees", logo: "images/brands/tubbees.png" },
  { id: "versace", name: "Versace", logo: "images/brands/versace.png" },
  { id: "viktor-rolf", name: "Viktor & Rolf", logo: "images/brands/viktor-rolf.png" },
  { id: "yves-saint-laurent", name: "Yves Saint Laurent", logo: "images/brands/yves-saint-laurent.png" },
];

// price placeholders — can edit every value in real time
const PH = (a,b,c,d) => ({ "1ml": a, "2ml": b, "3ml": c, "5ml": d });
const PRICE_TIERS = Object.freeze({
  value: PH(49, 89, 129, 199),
  everyday: PH(59, 109, 159, 249),
  select: PH(69, 129, 189, 299),
  premium: PH(79, 149, 219, 349),
  prestige: PH(99, 189, 279, 449),
  designer: PH(119, 229, 339, 549),
  luxury: PH(139, 269, 399, 649),
  elite: PH(159, 309, 459, 749),
});

// One entry per catalog item, kept here so prices never need to be scattered
// through the product descriptions below.
const PRICE_OVERRIDES = {
  "afnan|9AM Dive": PRICE_TIERS.select,
  "afnan|9AM for Women": PRICE_TIERS.select,
  "afnan|9PM": PRICE_TIERS.select,
  "afnan|9PM Night Out": PRICE_TIERS.prestige,
  "afnan|Modest Pour Homme Une": PRICE_TIERS.premium,
  "afnan|Supremacy Collector's Edition": PRICE_TIERS.prestige,
  "afnan|Supremacy Not Only Intense": PRICE_TIERS.designer,
  "afnan|Turathi Blue": PRICE_TIERS.prestige,
  "afnan|Turathi Electric": PRICE_TIERS.prestige,
  "afnan|Zimaya Rose of Dreams": PRICE_TIERS.everyday,
  "ahmed-al-maghribi|Kaaf": PRICE_TIERS.premium,
  "al-haramain|Amber Oud Gold Edition": PRICE_TIERS.designer,
  "al-haramain|Aqua Dubai": PRICE_TIERS.designer,
  "al-wataniah|Kayaan Classic": PRICE_TIERS.everyday,
  "arabiyat-prestige|Aristo": PRICE_TIERS.prestige,
  "arabiyat-prestige|Marwa": PRICE_TIERS.designer,
  "armaf|Club de Nuit Intense Man EDT": PRICE_TIERS.premium,
  "armaf|Club de Nuit Intense Man Limited Edition": PRICE_TIERS.prestige,
  "armaf|Club de Nuit Sillage": PRICE_TIERS.premium,
  "armaf|Club de Nuit Woman": PRICE_TIERS.premium,
  "armaf|Hunter": PRICE_TIERS.select,
  "armaf|Odyssey Limoni Fresh Edition": PRICE_TIERS.select,
  "armaf|Odyssey Mega Limited Edition": PRICE_TIERS.premium,
  "asdaaf|Ameerat Al Arab": PRICE_TIERS.everyday,
  "asdaaf|Ameerat Al Arab Prive Rose": PRICE_TIERS.select,
  "azzaro|The Most Wanted Intense EDP": PRICE_TIERS.elite,
  "azzaro|The Most Wanted Parfum": PRICE_TIERS.elite,
  "bujairami|Hectic": PRICE_TIERS.designer,
  "calvin-klein|Obsession for Women": PRICE_TIERS.designer,
  "fragrance-world|Aqua Pura": PRICE_TIERS.select,
  "fragrance-world|Barakkat Ambre Eve": PRICE_TIERS.select,
  "fragrance-world|Barakkat Gentle Gold": PRICE_TIERS.select,
  "fragrance-world|Barakkat Rouge 540 EDP": PRICE_TIERS.everyday,
  "fragrance-world|Barakkat Rouge Extrait": PRICE_TIERS.select,
  "fragrance-world|Barakkat Satin Oud": PRICE_TIERS.select,
  "fragrance-world|Classy Chic Girl": PRICE_TIERS.everyday,
  "fragrance-world|Cocktail Intense": PRICE_TIERS.everyday,
  "fragrance-world|F Le Parfum": PRICE_TIERS.select,
  "fragrance-world|Harmony Code Absolute": PRICE_TIERS.everyday,
  "fragrance-world|John Gustav Homme Amaze": PRICE_TIERS.everyday,
  "fragrance-world|John Gustav Homme Le Parfum": PRICE_TIERS.everyday,
  "fragrance-world|La Uno Million EDP": PRICE_TIERS.everyday,
  "fragrance-world|La Uno Million Elixir": PRICE_TIERS.select,
  "fragrance-world|Montera Instant Love": PRICE_TIERS.select,
  "fragrance-world|No. 4 After Love": PRICE_TIERS.everyday,
  "fragrance-world|Proud of You Absolute": PRICE_TIERS.select,
  "fragrance-world|Ur Way": PRICE_TIERS.everyday,
  "fragrance-world|Varakh Silver": PRICE_TIERS.everyday,
  "french-avenue|Aether Extrait": PRICE_TIERS.prestige,
  "french-avenue|Amber Empire": PRICE_TIERS.designer,
  "french-avenue|Aromatix Platine Blanc": PRICE_TIERS.premium,
  "french-avenue|Atlantis Extrait": PRICE_TIERS.prestige,
  "french-avenue|Enigma Deux": PRICE_TIERS.premium,
  "french-avenue|Enigma Une": PRICE_TIERS.premium,
  "french-avenue|Liquid Brun": PRICE_TIERS.premium,
  "french-avenue|Pinnace": PRICE_TIERS.prestige,
  "french-avenue|Ravine Ginger": PRICE_TIERS.prestige,
  "french-avenue|Spectre Wraith": PRICE_TIERS.premium,
  "french-avenue|Vulcan Baie": PRICE_TIERS.prestige,
  "french-avenue|Vulcan FEU": PRICE_TIERS.prestige,
  "giorgio-armani|Stronger With You Intensely": PRICE_TIERS.elite,
  "jpg|Le Male Elixir Absolu": PRICE_TIERS.elite,
  "jpg|Le Male Le Parfum": PRICE_TIERS.elite,
  "jpg|Ultramale": PRICE_TIERS.luxury,
  "khadlaj|Intoxicate Mystique": PRICE_TIERS.prestige,
  "khadlaj|Island": PRICE_TIERS.prestige,
  "khadlaj|Island Dreams": PRICE_TIERS.prestige,
  "khadlaj|Panache Angel Dust": PRICE_TIERS.designer,
  "khadlaj|Ria": PRICE_TIERS.premium,
  "khadlaj|Shiyaaka Snow": PRICE_TIERS.select,
  "khadlaj|Titan": PRICE_TIERS.premium,
  "lattafa|Ameer Al Oudh Intense": PRICE_TIERS.everyday,
  "lattafa|Angham": PRICE_TIERS.prestige,
  "lattafa|Art of Universe": PRICE_TIERS.prestige,
  "lattafa|Asad": PRICE_TIERS.select,
  "lattafa|Asad Bourbon": PRICE_TIERS.select,
  "lattafa|Asad Elixir": PRICE_TIERS.prestige,
  "lattafa|Asad Zanzibar": PRICE_TIERS.select,
  "lattafa|Bade'e Al Oud Honor & Glory": PRICE_TIERS.everyday,
  "lattafa|Eclaire": PRICE_TIERS.select,
  "lattafa|Fakhar": PRICE_TIERS.select,
  "lattafa|Hayaati Florence": PRICE_TIERS.everyday,
  "lattafa|Khamrah": PRICE_TIERS.select,
  "lattafa|Khamrah Qahwa": PRICE_TIERS.premium,
  "lattafa|Khamrah Waha": PRICE_TIERS.premium,
  "lattafa|Liam Blue Shine": PRICE_TIERS.select,
  "lattafa|Liam Grey": PRICE_TIERS.select,
  "lattafa|Najdia": PRICE_TIERS.everyday,
  "lattafa|Najdia Intense": PRICE_TIERS.select,
  "lattafa|Nasheet": PRICE_TIERS.everyday,
  "lattafa|Rave Now": PRICE_TIERS.everyday,
  "lattafa|Yara Candy": PRICE_TIERS.select,
  "lattafa|Yara Elixir": PRICE_TIERS.select,
  "lattafa|Yara Pink": PRICE_TIERS.everyday,
  "lattafa|Yara Tous": PRICE_TIERS.everyday,
  "maison-alhambra|Baroque Rouge Extrait": PRICE_TIERS.select,
  "maison-alhambra|Candid Pour Homme": PRICE_TIERS.everyday,
  "maison-alhambra|Delilah Blanc": PRICE_TIERS.select,
  "maison-alhambra|Delilah Pour Femme": PRICE_TIERS.everyday,
  "maison-alhambra|Delilah Viola": PRICE_TIERS.select,
  "maison-alhambra|Glacier Bold": PRICE_TIERS.select,
  "maison-alhambra|Jean Lowe Immortal": PRICE_TIERS.premium,
  "maison-alhambra|Jorge Di Profondo": PRICE_TIERS.everyday,
  "maison-alhambra|Jorge Di Profumo": PRICE_TIERS.everyday,
  "maison-alhambra|Versencia Oro": PRICE_TIERS.everyday,
  "maison-alhambra|Versencia Rouge": PRICE_TIERS.everyday,
  "maison-alhambra|Yeah!": PRICE_TIERS.everyday,
  "maison-asrar|Legacy": PRICE_TIERS.prestige,
  "maison-asrar|Regent": PRICE_TIERS.prestige,
  "montblanc|Explorer": PRICE_TIERS.designer,
  "nautica|Voyage": PRICE_TIERS.everyday,
  "paris-corner|Emir Fire Your Desire": PRICE_TIERS.select,
  "paris-corner|Khair Pistachio": PRICE_TIERS.everyday,
  "paris-corner|Rifaaqat": PRICE_TIERS.premium,
  "paris-corner|Taskeen Caramel Cascade": PRICE_TIERS.everyday,
  "paris-corner|Taskeen Marina": PRICE_TIERS.everyday,
  "paris-corner|Vibrant Vetiver Delight": PRICE_TIERS.select,
  "rasasi|Hawas Black": PRICE_TIERS.prestige,
  "rasasi|Hawas Eclat": PRICE_TIERS.premium,
  "rasasi|Hawas for Him": PRICE_TIERS.premium,
  "rasasi|Hawas Ice": PRICE_TIERS.prestige,
  "rasasi|Hawas Kobra": PRICE_TIERS.prestige,
  "rasasi|Hawas Majestic": PRICE_TIERS.prestige,
  "rasasi|Hawas Malibu": PRICE_TIERS.prestige,
  "rayhaan|Aquatica": PRICE_TIERS.select,
  "rayhaan|Azul": PRICE_TIERS.select,
  "rayhaan|Elixir": PRICE_TIERS.premium,
  "rayhaan|Fresh Wave": PRICE_TIERS.everyday,
  "rayhaan|Imperia": PRICE_TIERS.everyday,
  "rayhaan|Imperia Intense": PRICE_TIERS.select,
  "rayhaan|Jungle Vibe": PRICE_TIERS.select,
  "rayhaan|Kiss": PRICE_TIERS.premium,
  "rayhaan|Nocturno Elixir": PRICE_TIERS.premium,
  "rayhaan|Obsidian": PRICE_TIERS.select,
  "rayhaan|Ocean Rush": PRICE_TIERS.select,
  "rayhaan|Pacific": PRICE_TIERS.select,
  "rayhaan|Pacific Aura": PRICE_TIERS.premium,
  "rayhaan|Terra": PRICE_TIERS.premium,
  "rayhaan|Tonquin Giza": PRICE_TIERS.premium,
  "riiffs|Freeze": PRICE_TIERS.select,
  "riiffs|Momento": PRICE_TIERS.select,
  "tubbees|Bubble Gum": PRICE_TIERS.select,
  "tubbees|Chocolate Fudge": PRICE_TIERS.select,
  "tubbees|Cookies & Cream": PRICE_TIERS.select,
  "tubbees|Cotton Candy": PRICE_TIERS.select,
  "tubbees|Strawberry Cheesecake": PRICE_TIERS.select,
  "tubbees|Unicorn Vanilla": PRICE_TIERS.select,
  "versace|Dylan Blue": PRICE_TIERS.designer,
  "versace|Eros EDP": PRICE_TIERS.designer,
  "viktor-rolf|Spicebomb Extreme": PRICE_TIERS.luxury,
  "yves-saint-laurent|Y EDP": PRICE_TIERS.elite,
};

const DEFAULT_PRICE = PRICE_TIERS.premium;

let _id = 0;
const nid = (brand) => `${brand}-${(++_id).toString().padStart(4,"0")}`;

function P(brandId, brandName, name, opts) {
  return {
    id: nid(brandId),
    brandId, brand: brandName, name,
    image: `images/products/${brandId}/${name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')}.png`,
    image2: `images/products/${brandId}/${name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')}-decant.png`,
    prices: opts.prices || PRICE_OVERRIDES[`${brandId}|${name}`] || DEFAULT_PRICE,
    concentration: opts.concentration || "Eau de Parfum",
    gender: opts.gender || "Unisex",
    description: opts.description || "A distinctive composition worth discovering through a decant before committing to a full bottle.",
    topNotes: opts.topNotes || [],
    heartNotes: opts.heartNotes || [],
    baseNotes: opts.baseNotes || [],
    longevity: opts.longevity || "Moderate (6-8 hours)",
    projection: opts.projection || "Moderate",
    inspiredBy: opts.inspiredBy || null,
    recommended: !!opts.recommended,
  };
}

const PRODUCTS = [];
const add = (p) => PRODUCTS.push(p);

/* ---------------------------- AFNAN ---------------------------- */
add(P("afnan","Afnan","9PM Night Out",{gender:"Unisex",recommended:true,
  topNotes:["Dragon Fruit","Bergamot","Cognac","Lavender","Apple"],
  heartNotes:["Cardamom","Mahonial","Suede","Toffee","Cedar"],
  baseNotes:["Tonka Bean","Akigalawood","Ambrofix","Patchouli"],
  longevity:"Long (8-10 hours)", projection:"Strong",
  description:"A fruity-sweet, suede-laced take on the 9PM line — dragon fruit and cognac up top, settling into a warm, shadowed suede and toffee heart."}));
add(P("afnan","Afnan","9PM",{gender:"Men",recommended:true,concentration:"Eau de Parfum",
  topNotes:["Apple","Cinnamon","Wild Lavender","Bergamot"],
  heartNotes:["Orange Blossom","Lily-of-the-Valley"],
  baseNotes:["Vanilla","Tonka Bean","Amber","Patchouli"],
  longevity:"Long (8-10 hours)", projection:"Strong",
  description:"Afnan's best-selling oriental vanilla — candied apple and cinnamon over a smooth, powdery vanilla-tonka base built for cold-weather evenings."}));
add(P("afnan","Afnan","9AM Dive",{gender:"Men",
  topNotes:["Marine Notes","Bergamot","Grapefruit"],
  heartNotes:["Lavender","Geranium"],
  baseNotes:["Musk","Cedarwood","Ambroxan"],
  longevity:"Moderate (6-8 hours)", projection:"Moderate",
  description:"An aquatic, daytime counterpart to the 9AM line, built around crisp marine freshness and clean woods."}));
add(P("afnan","Afnan","9AM for Women",{gender:"Women",
  topNotes:["Bergamot","Pear","Pink Pepper"],
  heartNotes:["Rose","Jasmine","Peony"],
  baseNotes:["Musk","Amber","Sandalwood"],
  longevity:"Moderate (6-8 hours)", projection:"Moderate",
  description:"A soft floral-musk companion piece to 9AM, brightened with pear and pink pepper."}));
add(P("afnan","Afnan","Modest Pour Homme Une",{gender:"Men",
  topNotes:["Bergamot","Cardamom"],heartNotes:["Rose","Oud"],baseNotes:["Amber","Musk","Sandalwood"],
  description:"A refined oud-amber composition designed for understated, everyday elegance."}));
add(P("afnan","Afnan","Supremacy Collector's Edition",{gender:"Men",concentration:"Extrait de Parfum",recommended:true,
  topNotes:["Bergamot","Apple","Lemon"],heartNotes:["Birch","Jasmine"],baseNotes:["Ambroxan","Patchouli","Musk"],
  longevity:"Very Long (10+ hours)", projection:"Very Strong",
  description:"The flagship of Afnan's Supremacy family in extrait strength — dense, smoky-sweet, and built for maximum presence."}));
add(P("afnan","Afnan","Supremacy Not Only Intense",{gender:"Men",concentration:"Eau de Parfum",
  topNotes:["Pink Pepper","Bergamot"],heartNotes:["Birch","Rose"],baseNotes:["Ambroxan","Patchouli"],
  description:"A deepened, more intense reading of the Supremacy line's signature birch-amber accord."}));
add(P("afnan","Afnan","Turathi Blue",{gender:"Men",
  topNotes:["Grapefruit","Mint","Aldehydes"],heartNotes:["Lavender","Geranium"],baseNotes:["Vetiver","Musk","Oakmoss"],
  description:"A cool, fresh-fougère take on Afnan's heritage Turathi line, brightened with mint and grapefruit."}));
add(P("afnan","Afnan","Turathi Electric",{gender:"Men",
  topNotes:["Bergamot","Black Pepper"],heartNotes:["Lavender","Sage"],baseNotes:["Tonka Bean","Vetiver","Amber"],
  description:"An energetic, spiced flanker of Turathi with a sharper, electric citrus opening."}));
add(P("afnan","Afnan","Zimaya Rose of Dreams",{gender:"Women",
  topNotes:["Bergamot","Pink Pepper"],heartNotes:["Rose","Peony","Lychee"],baseNotes:["Musk","Vanilla","Sandalwood"],
  description:"A dreamy, rose-forward gourmand-floral from the Zimaya sub-line, soft and feminine."}));

/* ---------------------------- ARMAF ---------------------------- */
add(P("armaf","Armaf","Club de Nuit Sillage",{gender:"Unisex",concentration:"Extrait de Parfum",
  topNotes:["Lemon","Pineapple","Bergamot"],heartNotes:["Birch","Jasmine","Rose"],baseNotes:["Ambergris","Musk","Patchouli"],
  description:"A sillage-boosted extrait built on the legendary Club de Nuit DNA — louder and longer than the original EDT."}));
add(P("armaf","Armaf","Club de Nuit Intense Man EDT",{gender:"Men",recommended:true,concentration:"Eau de Toilette",
  topNotes:["Lemon","Pineapple","Bergamot","Black Currant","Apple"],
  heartNotes:["Birch","Jasmine","Rose"],
  baseNotes:["Ambergris","Musk","Patchouli","Vanilla"],
  longevity:"Long (8-12 hours)", projection:"Strong",
  description:"The fragrance that redefined the budget-luxury category — a citrus-fruit blast over smoky birch, worn by millions as an Aventus alternative."}));
add(P("armaf","Armaf","Club de Nuit Intense Man Limited Edition",{gender:"Men",concentration:"Parfum",
  topNotes:["Lemon","Pineapple","Lime","Black Pepper","Bergamot","Pink Pepper"],
  heartNotes:["Jasmine","Rose","Lily-of-the-Valley","Freesia"],
  baseNotes:["White Musk","Ambroxan","Ambergris","Cedar","Leather","Patchouli"],
  longevity:"Very Long (10+ hours)", projection:"Very Strong",
  description:"A richer, leather-inflected Limited Edition Parfum reading of Club de Nuit Intense, with an added floral complexity."}));
add(P("armaf","Armaf","Club de Nuit Woman",{gender:"Women",
  topNotes:["Peach","Raspberry","Bergamot"],heartNotes:["Rose","Jasmine","Praline"],baseNotes:["Vanilla","Amber","Musk"],
  description:"The feminine counterpart to Club de Nuit — fruity-floral up top over a sweet vanilla-amber base."}));
add(P("armaf","Armaf","Hunter",{gender:"Men",concentration:"Eau de Toilette",
  topNotes:["Green Apple","Bergamot","Mandarin"],heartNotes:["Lavender","Geranium"],baseNotes:["Sandalwood","Musk","Amber"],
  description:"A crisp, everyday fresh-fougère built for daytime versatility."}));
add(P("armaf","Armaf","Odyssey Mega Limited Edition",{gender:"Men",concentration:"Eau de Parfum",recommended:true,
  topNotes:["Bergamot","Lavender","Cardamom"],heartNotes:["Geranium","Sage"],baseNotes:["Amberwood","Musk","Tonka Bean"],
  description:"A bold, amplified edition of the Odyssey line with extra depth in the amberwood base."}));
add(P("armaf","Armaf","Odyssey Limoni Fresh Edition",{gender:"Men",concentration:"Eau de Toilette",
  topNotes:["Lemon","Bergamot","Mandarin"],heartNotes:["Lavender","Rosemary"],baseNotes:["Musk","Cedarwood"],
  description:"A zesty citrus-aromatic flanker of Odyssey, built for warm-weather wear."}));

/* ---------------------------- JEAN PAUL GAULTIER ---------------------------- */
add(P("jpg","Jean Paul Gaultier","Le Male Elixir Absolu",{gender:"Men",concentration:"Parfum",recommended:true,
  topNotes:["Cardamom","Bergamot"],heartNotes:["Lavender","Cinnamon"],baseNotes:["Vanilla","Tonka Bean","Amberwood"],
  longevity:"Very Long (10+ hours)", projection:"Very Strong",
  description:"The most concentrated, resinous expression of the Le Male family — a dense vanilla-tonka amber built for cold nights."}));
add(P("jpg","Jean Paul Gaultier","Le Male Le Parfum",{gender:"Men",recommended:true,concentration:"Eau de Parfum",
  topNotes:["Cardamom"],heartNotes:["Lavender","Iris"],baseNotes:["Vanilla","Oriental Notes","Woodsy Notes"],
  longevity:"Long (8-10 hours)", projection:"Strong",
  description:"A darker, iris-inflected reading of Le Male — smooth cardamom and lavender resolving into a powdery, vanilla-woods dry-down."}));
add(P("jpg","Jean Paul Gaultier","Ultramale",{gender:"Men",concentration:"Eau de Toilette",recommended:true,
  topNotes:["Mandarin","Lavender","Cardamom"],heartNotes:["Caramel","Cinnamon"],baseNotes:["Vanilla","Patchouli","Amber"],
  longevity:"Long (8-10 hours)", projection:"Strong",
  description:"A sweeter, caramel-forward twist on the Le Male DNA that became a modern classic in its own right."}));

/* ---------------------------- VERSACE ---------------------------- */
add(P("versace","Versace","Eros EDP",{gender:"Men",recommended:true,concentration:"Eau de Parfum",
  topNotes:["Mint","Lemon","Green Apple","Mandarin Orange"],
  heartNotes:["Ambroxan","Geranium","Clary Sage"],
  baseNotes:["Vanilla","Cedar","Sandalwood","Bitter Orange","Patchouli","Leather"],
  longevity:"Long (8-10 hours)", projection:"Strong",
  description:"A richer, deeper reading of the original Eros — sweet minty apple over a vanilla-cedar-leather base built for evenings."}));
add(P("versace","Versace","Dylan Blue",{gender:"Men",concentration:"Eau de Toilette",
  topNotes:["Calabrian Bergamot","Grapefruit","Fig Leaf","Water Notes"],
  heartNotes:["Ambroxan","Patchouli","Black Pepper","Violet Leaf","Papyrus"],
  baseNotes:["Incense","Musk","Tonka Bean","Saffron"],
  longevity:"Long (8-10 hours)", projection:"Strong",
  description:"A blue, aquatic-woody signature scent — bergamot and fig over a smoky incense-patchouli base."}));

/* ---------------------------- LATTAFA ---------------------------- */
add(P("lattafa","Lattafa","Yara Pink",{gender:"Women",
  topNotes:["Pear","Bergamot"],heartNotes:["Orange Blossom","Sambac Jasmine"],baseNotes:["Vanilla","Musk","Sandalwood"],
  description:"A soft pink-gourmand from the Yara family, pear and jasmine over creamy vanilla musk."}));
add(P("lattafa","Lattafa","Yara Elixir",{gender:"Women",concentration:"Eau de Parfum",recommended:true,
  topNotes:["Pear","Mandarin"],heartNotes:["Jasmine","Orange Blossom"],baseNotes:["Vanilla","Tonka Bean","Musk"],
  description:"A richer, more intense elixir edition of Yara — deeper vanilla and tonka in the base."}));
add(P("lattafa","Lattafa","Yara Candy",{gender:"Women",
  topNotes:["Red Berries","Pear"],heartNotes:["Caramel","Jasmine"],baseNotes:["Vanilla","Musk"],
  description:"A playful, candy-sweet flanker built around caramel and red fruit."}));
add(P("lattafa","Lattafa","Yara Tous",{gender:"Women",
  topNotes:["Pear","Bergamot"],heartNotes:["Jasmine","Orange Blossom"],baseNotes:["Musk","Vanilla","Woody Notes"],
  description:"A soft, blended edition of the Yara line balancing fruit, florals and musk."}));
add(P("lattafa","Lattafa","Asad",{gender:"Men",concentration:"Eau de Parfum",recommended:true,
  topNotes:["Bergamot","Lavender"],heartNotes:["Geranium","Cinnamon"],baseNotes:["Oud","Amber","Patchouli"],
  description:"A bold oud-amber built for presence — Lattafa's answer to the modern oriental fougère."}));
add(P("lattafa","Lattafa","Asad Elixir",{gender:"Men",concentration:"Eau de Parfum",
  topNotes:["Bergamot","Spices"],heartNotes:["Cinnamon","Geranium"],baseNotes:["Oud","Amber","Vanilla"],
  description:"A sweeter, more resinous elixir edition of Asad with added vanilla depth."}));
add(P("lattafa","Lattafa","Asad Zanzibar",{gender:"Men",
  topNotes:["Spices","Citrus"],heartNotes:["Fruits","Cinnamon"],baseNotes:["Oud","Woody Notes","Amber"],
  description:"A spiced, fruit-laced Zanzibar-themed take on Asad."}));
add(P("lattafa","Lattafa","Asad Bourbon",{gender:"Men",
  topNotes:["Bourbon Accord","Spices"],heartNotes:["Cinnamon","Tobacco"],baseNotes:["Oud","Amber","Vanilla"],
  description:"A boozy, tobacco-tinged flanker built around a bourbon accord."}));
add(P("lattafa","Lattafa","Ameer Al Oudh Intense",{gender:"Unisex",concentration:"Eau de Parfum",recommended:true,
  topNotes:["Saffron","Bergamot"],heartNotes:["Oud","Rose"],baseNotes:["Amber","Musk","Sandalwood"],
  description:"An intense, saffron-oud composition true to Lattafa's oriental heritage line."}));
add(P("lattafa","Lattafa","Art of Universe",{gender:"Unisex",
  topNotes:["Saffron","Pear"],heartNotes:["Oud","Rose"],baseNotes:["Amber","Musk"],
  description:"A layered oriental blending saffron and oud with a soft floral heart."}));
add(P("lattafa","Lattafa","Angham",{gender:"Women",
  topNotes:["Pear","Bergamot"],heartNotes:["Rose","Jasmine"],baseNotes:["Vanilla","Musk"],
  description:"A gentle floral-gourmand designed for everyday feminine wear."}));
add(P("lattafa","Lattafa","Bade'e Al Oud Honor & Glory",{gender:"Unisex",concentration:"Eau de Parfum",recommended:true,
  topNotes:["Saffron","Cardamom"],heartNotes:["Oud","Rose"],baseNotes:["Amber","Sandalwood","Musk"],
  description:"A ceremonial oud composition from the Bade'e Al Oud collection, deep and resinous."}));
add(P("lattafa","Lattafa","Eclaire",{gender:"Women",
  topNotes:["Bergamot","Pear"],heartNotes:["Jasmine","Peony"],baseNotes:["Musk","Vanilla"],
  description:"A luminous, soft-floral fragrance named for its bright, clean character."}));
add(P("lattafa","Lattafa","Fakhar",{gender:"Men",
  topNotes:["Bergamot","Spices"],heartNotes:["Geranium","Lavender"],baseNotes:["Oud","Amber","Musk"],
  description:"A proud, spicy oriental built for evening wear."}));
add(P("lattafa","Lattafa","Hayaati Florence",{gender:"Women",
  topNotes:["Bergamot","Peach"],heartNotes:["Rose","Jasmine"],baseNotes:["Musk","Vanilla","Sandalwood"],
  description:"A floral homage to Florence — soft rose and jasmine over a musky base."}));
add(P("lattafa","Lattafa","Khamrah",{gender:"Unisex",recommended:true,concentration:"Eau de Parfum",
  topNotes:["Cinnamon","Nutmeg","Bergamot"],
  heartNotes:["Dates","Praline","Tuberose","Mahonial"],
  baseNotes:["Vanilla","Tonka Bean","Benzoin","Myrrh","Amberwood","Akigalawood"],
  longevity:"Long (8-10 hours)", projection:"Strong",
  description:"Lattafa's breakout gourmand-oriental — a rare date-praline accord over cinnamon and creamy vanilla-amberwood, honoring Gulf hospitality traditions."}));
add(P("lattafa","Lattafa","Khamrah Qahwa",{gender:"Unisex",recommended:true,concentration:"Eau de Parfum",
  topNotes:["Cinnamon","Cardamom","Ginger"],
  heartNotes:["Praline","Candied Fruits","White Flowers"],
  baseNotes:["Vanilla","Coffee","Tonka Bean","Benzoin","Musk"],
  longevity:"Long (8-10 hours)", projection:"Strong",
  description:"The coffee-laced flanker of Khamrah — warm cinnamon and cardamom meeting a dark roast coffee note before settling into praline-vanilla richness."}));
add(P("lattafa","Lattafa","Khamrah Waha",{gender:"Unisex",concentration:"Eau de Parfum",
  topNotes:["Bergamot","Yuzu","Juniper","Ginger"],
  heartNotes:["Cucumber","Sea Salt","Iris","Sage"],
  baseNotes:["Vanilla","Tonka Bean","Musk","Akigalawood","Ambrofix"],
  longevity:"Moderate (6-8 hours)", projection:"Moderate",
  description:"A cooler, aquatic-oasis flanker of Khamrah — 'the heat of the desert finished with an unexpected frozen breath.'"}));
add(P("lattafa","Lattafa","Liam Blue Shine",{gender:"Men",
  topNotes:["Bergamot","Marine Notes"],heartNotes:["Lavender","Geranium"],baseNotes:["Musk","Cedarwood","Ambroxan"],
  description:"A crisp, blue-toned aquatic fougère for daily wear."}));
add(P("lattafa","Lattafa","Liam Grey",{gender:"Men",
  topNotes:["Bergamot","Pepper"],heartNotes:["Lavender","Sage"],baseNotes:["Vetiver","Musk","Amber"],
  description:"A slightly darker, spicier take on the Liam line."}));
add(P("lattafa","Lattafa","Najdia",{gender:"Unisex",
  topNotes:["Saffron","Rose"],heartNotes:["Oud","Amber"],baseNotes:["Musk","Sandalwood"],
  description:"A traditional, rose-oud oriental from the Najdia line."}));
add(P("lattafa","Lattafa","Najdia Intense",{gender:"Unisex",concentration:"Eau de Parfum",
  topNotes:["Saffron","Rose"],heartNotes:["Oud","Amber"],baseNotes:["Musk","Sandalwood","Vanilla"],
  description:"A deepened, more resinous intense edition of Najdia."}));
add(P("lattafa","Lattafa","Nasheet",{gender:"Men",
  topNotes:["Citrus","Spices"],heartNotes:["Geranium","Lavender"],baseNotes:["Amber","Musk","Woody Notes"],
  description:"A light, everyday oriental-fresh composition."}));
add(P("lattafa","Lattafa","Rave Now",{gender:"Unisex",recommended:true,
  topNotes:["Pineapple","Bergamot"],heartNotes:["Jasmine","Praline"],baseNotes:["Vanilla","Musk","Amberwood"],
  description:"An energetic, party-ready gourmand built for nights out."}));

/* ---------------------------- KHADLAJ ---------------------------- */
add(P("khadlaj","Khadlaj","Island",{gender:"Unisex",
  topNotes:["Coconut","Bergamot"],heartNotes:["Tropical Florals"],baseNotes:["Sandalwood","Musk","Amber"],
  description:"A tropical, coconut-laced escapist fragrance."}));
add(P("khadlaj","Khadlaj","Island Dreams",{gender:"Unisex",
  topNotes:["Coconut Water","Pineapple"],heartNotes:["Frangipani"],baseNotes:["Musk","Sandalwood"],
  description:"A dreamier, softer flanker of Island with tropical florals."}));
add(P("khadlaj","Khadlaj","Intoxicate Mystique",{gender:"Unisex",concentration:"Eau de Parfum",
  topNotes:["Saffron","Bergamot"],heartNotes:["Oud","Rose"],baseNotes:["Amber","Musk"],
  description:"A mysterious oud-rose oriental with a saffron-spiced opening."}));
add(P("khadlaj","Khadlaj","Panache Angel Dust",{gender:"Women",
  topNotes:["Pear","Pink Pepper"],heartNotes:["Jasmine","Peony"],baseNotes:["Musk","Vanilla"],
  description:"A powdery, angelic floral-musk from the Panache collection."}));
add(P("khadlaj","Khadlaj","Ria",{gender:"Women",
  topNotes:["Bergamot","Peach"],heartNotes:["Rose","Jasmine"],baseNotes:["Vanilla","Musk"],
  description:"A soft, romantic floral built for everyday feminine wear."}));
add(P("khadlaj","Khadlaj","Shiyaaka Snow",{gender:"Unisex",
  topNotes:["Bergamot","Mint"],heartNotes:["Iris","Lavender"],baseNotes:["Musk","Woody Notes","Vanilla"],
  description:"A cool, snow-white musky composition from the Shiyaaka line."}));
add(P("khadlaj","Khadlaj","Titan",{gender:"Men",concentration:"Eau de Parfum",
  topNotes:["Bergamot","Pepper"],heartNotes:["Geranium","Sage"],baseNotes:["Oud","Amber","Vetiver"],
  description:"A powerful, titan-sized oriental woody built for maximum presence."}));

/* ---------------------------- FRAGRANCE WORLD ---------------------------- */
add(P("fragrance-world","Fragrance World","Aqua Pura",{gender:"Unisex",
  topNotes:["Marine Notes","Bergamot"],heartNotes:["Water Lily"],baseNotes:["Musk","Cedarwood"],
  description:"A clean, translucent aquatic built for freshness."}));
add(P("fragrance-world","Fragrance World","Barakkat Ambre Eve",{gender:"Unisex",concentration:"Eau de Parfum",recommended:true,
  topNotes:["Bergamot","Saffron"],heartNotes:["Amber","Rose"],baseNotes:["Vanilla","Musk","Sandalwood"],
  description:"A luminous amber-rose oriental from the acclaimed Barakkat family."}));
add(P("fragrance-world","Fragrance World","Barakkat Rouge 540 EDP",{gender:"Unisex",concentration:"Eau de Parfum",recommended:true,
  topNotes:["Saffron","Jasmine"],heartNotes:["Amberwood","Ambergris"],baseNotes:["Cedar","Musk"],
  description:"A widely-loved interpretation of the iconic saffron-jasmine-amberwood accord."}));
add(P("fragrance-world","Fragrance World","Barakkat Rouge Extrait",{gender:"Unisex",concentration:"Extrait de Parfum",recommended:true,
  topNotes:["Saffron","Jasmine"],heartNotes:["Amberwood","Ambergris"],baseNotes:["Cedar","Musk","Vanilla"],
  description:"An extrait-strength, longer-lasting reading of the Barakkat Rouge accord."}));
add(P("fragrance-world","Fragrance World","Barakkat Satin Oud",{gender:"Unisex",
  topNotes:["Rose","Saffron"],heartNotes:["Oud","Amber"],baseNotes:["Musk","Sandalwood"],
  description:"A silky, satin-smooth oud-rose composition."}));
add(P("fragrance-world","Fragrance World","Barakkat Gentle Gold",{gender:"Women",
  topNotes:["Bergamot","Pear"],heartNotes:["Rose","Jasmine"],baseNotes:["Vanilla","Musk"],
  description:"A gentle, golden floral-gourmand from the Barakkat family."}));
add(P("fragrance-world","Fragrance World","Classy Chic Girl",{gender:"Women",
  topNotes:["Bergamot","Raspberry"],heartNotes:["Peony","Jasmine"],baseNotes:["Musk","Vanilla"],
  description:"A youthful, chic floral-fruity for everyday elegance."}));
add(P("fragrance-world","Fragrance World","Cocktail Intense",{gender:"Unisex",concentration:"Eau de Parfum",
  topNotes:["Red Fruits","Bergamot"],heartNotes:["Spices","Praline"],baseNotes:["Vanilla","Amber","Musk"],
  description:"A festive, fruit-spice cocktail-inspired gourmand."}));
add(P("fragrance-world","Fragrance World","Ur Way",{gender:"Men",
  topNotes:["Bergamot","Apple"],heartNotes:["Geranium","Lavender"],baseNotes:["Amberwood","Musk"],
  description:"A confident, modern woody-fresh signature scent."}));
add(P("fragrance-world","Fragrance World","John Gustav Homme Le Parfum",{gender:"Men",concentration:"Parfum",
  topNotes:["Bergamot","Spices"],heartNotes:["Lavender","Cardamom"],baseNotes:["Tonka Bean","Amber","Vanilla"],
  description:"A refined oriental-fougère paying tribute to classic gentleman's perfumery."}));
add(P("fragrance-world","Fragrance World","John Gustav Homme Amaze",{gender:"Men",
  topNotes:["Citrus","Pepper"],heartNotes:["Geranium","Sage"],baseNotes:["Vetiver","Musk","Amber"],
  description:"A sharper, spicier flanker of the John Gustav Homme line."}));
add(P("fragrance-world","Fragrance World","Harmony Code Absolute",{gender:"Unisex",
  topNotes:["Bergamot","Pink Pepper"],heartNotes:["Iris","Violet"],baseNotes:["Musk","Sandalwood","Vanilla"],
  description:"A balanced, harmonious floral-woody composition."}));
add(P("fragrance-world","Fragrance World","Montera Instant Love",{gender:"Unisex",concentration:"Eau de Parfum",
  topNotes:["Saffron","Ginger","Fruits","Citruses"],heartNotes:["Amber","Rose","Jasmine"],baseNotes:["Vanilla","Sandalwood","White Musk","Oakmoss"],
  description:"A warm spicy amber-floral that pairs sparkling saffron, ginger and citrus with rose, jasmine and a creamy vanilla-musk dry-down."}));
add(P("fragrance-world","Fragrance World","Proud of You Absolute",{gender:"Men",concentration:"Eau de Parfum",
  topNotes:["Rum","Bergamot","Elemi"],heartNotes:["Lavender","Davana"],baseNotes:["Madagascar Vanilla","Chestnut","Cedar","Patchouli"],
  description:"A rich boozy gourmand for men, blending rum and bergamot with aromatic lavender, roasted chestnut and deep Madagascar vanilla."}));
add(P("fragrance-world","Fragrance World","Varakh Silver",{gender:"Unisex",concentration:"Eau de Parfum",
  topNotes:["Saffron","Rose"],heartNotes:["Oud","Amber"],baseNotes:["Musk","Sandalwood"],
  description:"A silver-leaf inspired oud-rose oriental with a refined, luminous character."}));
add(P("fragrance-world","Fragrance World","La Uno Million Elixir",{gender:"Men",concentration:"Eau de Parfum",
  topNotes:["Mint","Grapefruit"],heartNotes:["Cinnamon","Spices"],baseNotes:["Leather","Amber","Woody Notes"],
  description:"An intense, leathery elixir edition inspired by gold-bottle glamour."}));
add(P("fragrance-world","Fragrance World","La Uno Million EDP",{gender:"Men",
  topNotes:["Mint","Grapefruit"],heartNotes:["Cinnamon","Spices"],baseNotes:["Leather","Amber"],
  description:"A bold, leathery-spiced signature scent evoking gold-bottle glamour."}));
add(P("fragrance-world","Fragrance World","F Le Parfum",{gender:"Men",
  topNotes:["Bergamot","Spices"],heartNotes:["Lavender","Geranium"],baseNotes:["Tonka Bean","Amber"],
  description:"A clean, structured fougère built for daily elegance."}));
add(P("fragrance-world","Fragrance World","No. 4 After Love",{gender:"Women",
  topNotes:["Bergamot","Pink Pepper"],heartNotes:["Rose","Peony"],baseNotes:["Musk","Vanilla","Amber"],
  description:"A romantic, rose-forward floral built for date nights."}));

/* ---------------------------- FRENCH AVENUE ---------------------------- */
add(P("french-avenue","French Avenue","Amber Empire",{gender:"Unisex",concentration:"Eau de Parfum",recommended:true,
  topNotes:["Saffron","Bergamot"],heartNotes:["Amber","Rose"],baseNotes:["Vanilla","Musk","Sandalwood"],
  description:"A grand, imperial amber oriental with a saffron-spiced opening."}));
add(P("french-avenue","French Avenue","Aether Extrait",{gender:"Unisex",concentration:"Extrait de Parfum",
  topNotes:["Bergamot","Pink Pepper"],heartNotes:["Iris","Violet"],baseNotes:["Musk","Sandalwood","Amber"],
  description:"An ethereal, powdery iris-violet extrait."}));
add(P("french-avenue","French Avenue","Atlantis Extrait",{gender:"Unisex",concentration:"Extrait de Parfum",
  topNotes:["Marine Notes","Bergamot"],heartNotes:["Amber","Musk"],baseNotes:["Sandalwood","Ambergris"],
  description:"A deep, oceanic-amber extrait evoking a lost underwater world."}));
add(P("french-avenue","French Avenue","Aromatix Platine Blanc",{gender:"Unisex",
  topNotes:["Bergamot","Aldehydes"],heartNotes:["White Musk","Iris"],baseNotes:["Sandalwood","Amber"],
  description:"A clean, platinum-toned white musk composition."}));
add(P("french-avenue","French Avenue","Enigma Deux",{gender:"Unisex",concentration:"Eau de Parfum",
  topNotes:["Bergamot","Spices"],heartNotes:["Oud","Rose"],baseNotes:["Amber","Musk"],
  description:"A mysterious, layered oud-rose oriental — the second chapter in the Enigma story."}));
add(P("french-avenue","French Avenue","Enigma Une",{gender:"Unisex",concentration:"Eau de Parfum",
  topNotes:["Saffron","Bergamot"],heartNotes:["Oud","Amber"],baseNotes:["Musk","Sandalwood"],
  description:"The original Enigma — a mysterious, saffron-laced oud oriental."}));
add(P("french-avenue","French Avenue","Liquid Brun",{gender:"Men",
  topNotes:["Bergamot","Spices"],heartNotes:["Tobacco","Leather"],baseNotes:["Amber","Vanilla","Woody Notes"],
  description:"A rich, brown-toned tobacco-leather composition."}));
add(P("french-avenue","French Avenue","Pinnace",{gender:"Men",
  topNotes:["Bergamot","Marine Notes"],heartNotes:["Lavender","Geranium"],baseNotes:["Musk","Cedarwood"],
  description:"A nautical, breezy fresh-fougère for daily wear."}));
add(P("french-avenue","French Avenue","Ravine Ginger",{gender:"Unisex",
  topNotes:["Ginger","Bergamot"],heartNotes:["Spices","Cardamom"],baseNotes:["Amber","Musk","Woody Notes"],
  description:"A spicy, ginger-forward composition with a warm woody base."}));
add(P("french-avenue","French Avenue","Spectre Wraith",{gender:"Men",concentration:"Eau de Parfum",
  topNotes:["Bergamot","Black Pepper"],heartNotes:["Leather","Incense"],baseNotes:["Oud","Amber","Musk"],
  description:"A shadowy, incense-leather oriental built for evening presence."}));
add(P("french-avenue","French Avenue","Vulcan Baie",{gender:"Men",
  topNotes:["Bay Leaf","Bergamot"],heartNotes:["Spices","Pepper"],baseNotes:["Amber","Woody Notes","Musk"],
  description:"A fiery, spice-forward composition named for volcanic intensity."}));
add(P("french-avenue","French Avenue","Vulcan FEU",{gender:"Men",concentration:"Eau de Parfum",
  topNotes:["Pepper","Cinnamon"],heartNotes:["Spices","Incense"],baseNotes:["Amber","Leather","Musk"],
  description:"An even bolder, fire-themed flanker of Vulcan with a smoky incense base."}));

/* ---------------------------- MAISON ALHAMBRA ---------------------------- */
add(P("maison-alhambra","Maison Alhambra","Baroque Rouge Extrait",{gender:"Unisex",concentration:"Extrait de Parfum",recommended:true,
  topNotes:["Saffron","Jasmine"],heartNotes:["Amberwood","Rose"],baseNotes:["Cedar","Musk","Vanilla"],
  description:"An opulent, baroque-inspired extrait built on a rich saffron-amberwood accord."}));
add(P("maison-alhambra","Maison Alhambra","Candid Pour Homme",{gender:"Men",
  topNotes:["Bergamot","Lavender"],heartNotes:["Geranium","Spices"],baseNotes:["Tonka Bean","Amber","Musk"],
  description:"A candid, straightforward fougère for daily confidence."}));
add(P("maison-alhambra","Maison Alhambra","Delilah Pour Femme",{gender:"Women",
  topNotes:["Bergamot","Peach"],heartNotes:["Rose","Jasmine"],baseNotes:["Vanilla","Musk","Sandalwood"],
  description:"A soft, romantic floral-fruity built for feminine everyday wear."}));
add(P("maison-alhambra","Maison Alhambra","Delilah Blanc",{gender:"Women",
  topNotes:["Bergamot","Pear"],heartNotes:["White Flowers","Jasmine"],baseNotes:["Musk","Vanilla"],
  description:"A luminous white-floral flanker of Delilah."}));
add(P("maison-alhambra","Maison Alhambra","Delilah Viola",{gender:"Women",
  topNotes:["Bergamot","Violet Leaf"],heartNotes:["Violet","Iris"],baseNotes:["Musk","Sandalwood"],
  description:"A powdery, violet-forward reading of the Delilah line."}));
add(P("maison-alhambra","Maison Alhambra","Glacier Bold",{gender:"Men",
  topNotes:["Mint","Bergamot"],heartNotes:["Lavender","Sage"],baseNotes:["Vetiver","Musk","Amber"],
  description:"A cold, crisp glacier-inspired fresh-woody scent."}));
add(P("maison-alhambra","Maison Alhambra","Jean Lowe Immortal",{gender:"Men",concentration:"Eau de Parfum",recommended:true,
  topNotes:["Bergamot","Pear"],heartNotes:["Rose","Geranium"],baseNotes:["Oud","Amber","Leather"],
  description:"An immortal, timeless oud-leather oriental with a floral heart."}));
add(P("maison-alhambra","Maison Alhambra","Jorge Di Profondo",{gender:"Men",
  topNotes:["Bergamot","Spices"],heartNotes:["Leather","Tobacco"],baseNotes:["Amber","Woody Notes","Musk"],
  description:"A deep, profound leather-tobacco composition."}));
add(P("maison-alhambra","Maison Alhambra","Jorge Di Profumo",{gender:"Men",
  topNotes:["Citrus","Spices"],heartNotes:["Geranium","Lavender"],baseNotes:["Amber","Musk","Tonka Bean"],
  description:"A refined, classically-styled companion piece to Jorge Di Profondo."}));
add(P("maison-alhambra","Maison Alhambra","Versencia Oro",{gender:"Unisex",concentration:"Eau de Parfum",
  topNotes:["Bergamot","Saffron"],heartNotes:["Rose","Amber"],baseNotes:["Musk","Sandalwood","Vanilla"],
  description:"A golden, opulent oriental named for its luminous saffron-amber accord."}));
add(P("maison-alhambra","Maison Alhambra","Versencia Rouge",{gender:"Unisex",concentration:"Eau de Parfum",
  topNotes:["Saffron","Jasmine"],heartNotes:["Amberwood","Rose"],baseNotes:["Cedar","Musk"],
  description:"A red-toned Versencia flanker built on a warm amberwood accord."}));
add(P("maison-alhambra","Maison Alhambra","Yeah!",{gender:"Unisex",recommended:true,
  topNotes:["Citrus","Pear"],heartNotes:["Jasmine","Praline"],baseNotes:["Vanilla","Musk","Amberwood"],
  description:"A playful, upbeat gourmand designed to feel exactly like its name."}));

/* ---------------------------- RASASI ---------------------------- */
add(P("rasasi","Rasasi","Hawas for Him",{gender:"Men",recommended:true,concentration:"Eau de Parfum",
  topNotes:["Bergamot","Apple","Cinnamon","Lemon"],
  heartNotes:["Watery Notes","Plum","Orange Blossom","Cardamom"],
  baseNotes:["Ambergris","Musk","Driftwood","Patchouli"],
  longevity:"Long (8-9 hours)", projection:"Strong",
  description:"Rasasi's fresh-fruity signature scent — juicy apple and bergamot over a driftwood-patchouli base that made it a viral summer staple."}));
add(P("rasasi","Rasasi","Hawas Ice",{gender:"Men",concentration:"Eau de Parfum",
  topNotes:["Apple","Sicilian Bergamot","Italian Lemon","Star Anise"],
  heartNotes:["Plum","Orange Blossom","Cardamom"],
  baseNotes:["Moss","Musk","Driftwood","Amber"],
  longevity:"Long (8-9 hours)", projection:"Strong",
  description:"A cooler, more minty reading of Hawas for Him with the same driftwood-amber dry-down."}));
add(P("rasasi","Rasasi","Hawas Kobra",{gender:"Men",concentration:"Eau de Parfum",
  topNotes:["Ginger","Bergamot","Tangerine"],heartNotes:["Cinnamon","Neroli","Green Tea"],baseNotes:["Musk","Woodsy Notes","Amber"],
  description:"A spiced, striking flanker with ginger and green tea over a woody-musk base."}));
add(P("rasasi","Rasasi","Hawas Black",{gender:"Men",
  topNotes:["Pineapple","Bergamot","Grapefruit"],heartNotes:["Patchouli","Cedarwood","Jasmine"],baseNotes:["Oakmoss","Woody Notes","Amber"],
  description:"A darker, moss-forward edition of Hawas built for cooler seasons."}));
add(P("rasasi","Rasasi","Hawas Eclat",{gender:"Men",
  topNotes:["Bergamot","Apple"],heartNotes:["Orange Blossom","Cardamom"],baseNotes:["Musk","Amber","Driftwood"],
  description:"A brighter, more radiant 'eclat' edition of the Hawas signature accord."}));
add(P("rasasi","Rasasi","Hawas Malibu",{gender:"Men",concentration:"Eau de Parfum",
  topNotes:["Pineapple","Orange","Grapefruit"],heartNotes:["Orris","Amber","Lavender"],baseNotes:["Tonka Bean","Musk","Patchouli","Cashmeran"],
  description:"A sun-drenched, resort-inspired flanker with tropical citrus and a soft cashmeran base."}));

/* ---------------------------- RAYHAAN ---------------------------- */
add(P("rayhaan","Rayhaan","Ocean Rush",{gender:"Men",
  topNotes:["Marine Notes","Bergamot"],heartNotes:["Lavender","Geranium"],baseNotes:["Musk","Cedarwood"],
  description:"A rushing, aquatic fresh scent for everyday energy."}));
add(P("rayhaan","Rayhaan","Pacific",{gender:"Men",
  topNotes:["Sea Salt","Citrus"],heartNotes:["Water Lily","Sage"],baseNotes:["Ambergris","Musk"],
  description:"A wide-open oceanic composition named for the Pacific coastline."}));
add(P("rayhaan","Rayhaan","Fresh Wave",{gender:"Unisex",
  topNotes:["Bergamot","Grapefruit"],heartNotes:["Marine Notes","Mint"],baseNotes:["Musk","Cedarwood"],
  description:"A crisp, wave-inspired aquatic-citrus for daily wear."}));
add(P("rayhaan","Rayhaan","Imperia",{gender:"Unisex",concentration:"Eau de Parfum",recommended:true,
  topNotes:["Saffron","Bergamot"],heartNotes:["Rose","Amber"],baseNotes:["Oud","Musk","Sandalwood"],
  description:"An imperial, saffron-oud oriental designed for statement wear."}));
add(P("rayhaan","Rayhaan","Imperia Intense",{gender:"Unisex",concentration:"Eau de Parfum",
  topNotes:["Saffron","Spices"],heartNotes:["Rose","Oud"],baseNotes:["Amber","Musk","Vanilla"],
  description:"A deepened, more intense edition of Imperia with added vanilla warmth."}));
add(P("rayhaan","Rayhaan","Obsidian",{gender:"Men",concentration:"Eau de Parfum",
  topNotes:["Bergamot","Black Pepper"],heartNotes:["Leather","Incense"],baseNotes:["Oud","Amber","Woody Notes"],
  description:"A dark, volcanic-glass-inspired leather-oud composition."}));
add(P("rayhaan","Rayhaan","Azul",{gender:"Unisex",
  topNotes:["Bergamot","Marine Notes"],heartNotes:["Lavender","Iris"],baseNotes:["Musk","Sandalwood"],
  description:"A blue-toned, tranquil aquatic-woody fragrance."}));
add(P("rayhaan","Rayhaan","Aquatica",{gender:"Unisex",
  topNotes:["Marine Notes","Citrus"],heartNotes:["Water Lily","Mint"],baseNotes:["Musk","Cedarwood"],
  description:"A pure, clean aquatic built around water lily and mint."}));
add(P("rayhaan","Rayhaan","Elixir",{gender:"Unisex",concentration:"Eau de Parfum",
  topNotes:["Pear","Saffron"],heartNotes:["Rose","Amber"],baseNotes:["Vanilla","Musk","Sandalwood"],
  description:"A rich, elixir-strength oriental gourmand."}));
add(P("rayhaan","Rayhaan","Kiss",{gender:"Women",
  topNotes:["Red Berries","Bergamot"],heartNotes:["Rose","Peony"],baseNotes:["Musk","Vanilla"],
  description:"A flirtatious, fruity-floral built for romantic occasions."}));
add(P("rayhaan","Rayhaan","Terra",{gender:"Unisex",
  topNotes:["Bergamot","Green Notes"],heartNotes:["Vetiver","Geranium"],baseNotes:["Patchouli","Musk","Woody Notes"],
  description:"An earthy, grounded green-woody signature scent."}));
add(P("rayhaan","Rayhaan","Nocturno Elixir",{gender:"Unisex",concentration:"Eau de Parfum",
  topNotes:["Spices","Bergamot"],heartNotes:["Oud","Rose"],baseNotes:["Amber","Musk","Vanilla"],
  description:"A nocturnal, deeply resinous oud elixir for evening wear."}));
add(P("rayhaan","Rayhaan","Jungle Vibe",{gender:"Unisex",
  topNotes:["Tropical Fruits","Bergamot"],heartNotes:["Jasmine","Green Notes"],baseNotes:["Musk","Sandalwood"],
  description:"A lush, tropical-green composition evoking a jungle escape."}));
add(P("rayhaan","Rayhaan","Tonquin Giza",{gender:"Unisex",concentration:"Eau de Parfum",
  topNotes:["Saffron","Bergamot"],heartNotes:["Rose","Tonka Bean"],baseNotes:["Amber","Musk","Sandalwood"],
  description:"An Egyptian-inspired oriental named for the Giza plateau, built on tonka and amber."}));

/* ---------------------------- RIIFFS ---------------------------- */
add(P("riiffs","Riiffs","Momento",{gender:"Unisex",concentration:"Eau de Parfum",
  topNotes:["Bergamot","Pear"],heartNotes:["Jasmine","Amber"],baseNotes:["Musk","Vanilla","Sandalwood"],
  description:"A nostalgic, keepsake-worthy oriental gourmand."}));
add(P("riiffs","Riiffs","Freeze",{gender:"Unisex",
  topNotes:["Mint","Bergamot"],heartNotes:["Lavender","Iris"],baseNotes:["Musk","Woody Notes"],
  description:"A cool, icy-fresh composition built for warm climates."}));

/* ---------------------------- MAISON ASRAR ---------------------------- */
add(P("maison-asrar","Maison Asrar","Legacy",{gender:"Unisex",concentration:"Eau de Parfum",recommended:true,
  topNotes:["Saffron","Bergamot"],heartNotes:["Oud","Rose"],baseNotes:["Amber","Sandalwood","Musk"],
  description:"A heritage-inspired oud-rose oriental built to last generations."}));
add(P("maison-asrar","Maison Asrar","Regent",{gender:"Men",concentration:"Eau de Parfum",
  topNotes:["Bergamot","Spices"],heartNotes:["Leather","Tobacco"],baseNotes:["Amber","Woody Notes","Musk"],
  description:"A regal, leather-tobacco composition designed for commanding presence."}));

/* ---------------------------- NAUTICA ---------------------------- */
add(P("nautica","Nautica","Voyage",{gender:"Men",recommended:true,concentration:"Eau de Toilette",
  topNotes:["Green Leaves","Apple"],heartNotes:["Lotus","Mimosa"],baseNotes:["Musk","Cedar","Oakmoss","Amber"],
  longevity:"Moderate (5-7 hours)", projection:"Moderate",
  description:"An enduring aquatic-woody classic — a fresh, salty sea breeze carrying apple and lotus over cedar and amber."}));

/* ---------------------------- MONTBLANC ---------------------------- */
add(P("montblanc","Montblanc","Explorer",{gender:"Men",recommended:true,concentration:"Eau de Parfum",
  topNotes:["Bergamot","Pink Pepper"],heartNotes:["Vetiver","Patchouli"],baseNotes:["Leather","Ambroxan","Vanilla"],
  longevity:"Long (8-10 hours)", projection:"Strong",
  description:"A rugged, adventurous woody-leather signature scent built around vetiver and warm ambroxan."}));

/* ---------------------------- PARIS CORNER ---------------------------- */
add(P("paris-corner","Paris Corner","Emir Fire Your Desire",{gender:"Men",concentration:"Eau de Parfum",
  topNotes:["Bergamot","Spices"],heartNotes:["Leather","Oud"],baseNotes:["Amber","Woody Notes","Musk"],
  description:"A fiery, oud-leather oriental designed to ignite desire."}));
add(P("paris-corner","Paris Corner","Khair Pistachio",{gender:"Unisex",
  topNotes:["Pistachio Accord","Bergamot"],heartNotes:["Praline","Rose"],baseNotes:["Vanilla","Musk","Sandalwood"],
  description:"A distinctive nutty-gourmand built around a rare pistachio accord."}));
add(P("paris-corner","Paris Corner","Rifaaqat",{gender:"Unisex",concentration:"Eau de Parfum",
  topNotes:["Black Pepper","Elemi","Pink Pepper"],heartNotes:["Olibanum","Saffron"],baseNotes:["Vanilla","Cedarwood"],
  description:"A resinous spicy vanilla built around pepper, elemi and saffron, drying into smoky olibanum, creamy vanilla and cedarwood."}));
add(P("paris-corner","Paris Corner","Taskeen Caramel Cascade",{gender:"Women",
  topNotes:["Caramel","Bergamot"],heartNotes:["Praline","Jasmine"],baseNotes:["Vanilla","Musk"],
  description:"A cascading, caramel-drenched gourmand for sweet-scent lovers."}));
add(P("paris-corner","Paris Corner","Taskeen Marina",{gender:"Unisex",
  topNotes:["Marine Notes","Bergamot"],heartNotes:["Water Lily","Musk"],baseNotes:["Sandalwood","Amber"],
  description:"A calm, marina-inspired aquatic-woody scent."}));
add(P("paris-corner","Paris Corner","Vibrant Vetiver Delight",{gender:"Men",
  topNotes:["Bergamot","Grapefruit"],heartNotes:["Vetiver","Geranium"],baseNotes:["Patchouli","Musk","Cedarwood"],
  description:"A vibrant, earthy vetiver-forward composition for daily confidence."}));

/* ---------------------------- VIKTOR & ROLF ---------------------------- */
add(P("viktor-rolf","Viktor & Rolf","Spicebomb Extreme",{gender:"Men",concentration:"Eau de Parfum",recommended:true,
  topNotes:["Cinnamon","Pepper"],heartNotes:["Cumin","Tobacco Leaf"],baseNotes:["Leather","Vanilla","Amber"],
  longevity:"Very Long (10+ hours)", projection:"Very Strong",
  description:"An explosive, resinous reading of Spicebomb — cinnamon and tobacco detonating into a dense leather-amber base."}));

/* ---------------------------- YVES SAINT LAURENT ---------------------------- */
add(P("yves-saint-laurent","Yves Saint Laurent","Y EDP",{gender:"Men",concentration:"Eau de Parfum",recommended:true,
  topNotes:["Apple","Bergamot","Ginger"],heartNotes:["Sage","Geranium"],baseNotes:["Amberwood","Tonka Bean","Vetiver"],
  longevity:"Long (8-10 hours)", projection:"Strong",
  description:"A modern, self-made-man signature scent — crisp apple and ginger resolving into a smooth amberwood-tonka base."}));

/* ---------------------------- BUJAIRAMI ---------------------------- */
add(P("bujairami","Bujairami","Hectic",{gender:"Unisex",concentration:"Extrait de Parfum",
  topNotes:["Saffron","Bergamot"],heartNotes:["Oud","Rose"],baseNotes:["Amber","Musk","Sandalwood"],
  description:"An intense, whirlwind oriental true to its name — layered oud and saffron in constant motion."}));

/* ---------------------------- ARABIYAT PRESTIGE ---------------------------- */
add(P("arabiyat-prestige","Arabiyat Prestige","Aristo",{gender:"Men",concentration:"Eau de Parfum",
  topNotes:["Ginger Flower","Mandarin Orange","Orange","Lemon"],heartNotes:["Jasmine","Magnolia","Patchouli"],baseNotes:["Vanilla","Musk","Sandalwood"],
  description:"A vivid citrus-ginger fragrance with airy florals and patchouli, settling into a smooth vanilla, musk and sandalwood base."}));
add(P("arabiyat-prestige","Arabiyat Prestige","Marwa",{gender:"Women",concentration:"Eau de Parfum",
  topNotes:["Bergamot","Pear"],heartNotes:["Rose","Jasmine"],baseNotes:["Musk","Vanilla","Sandalwood"],
  description:"A graceful, rose-centered floral from the Arabiyat Prestige house."}));

/* ---------------------------- GIORGIO ARMANI ---------------------------- */
add(P("giorgio-armani","Giorgio Armani","Stronger With You Intensely",{gender:"Men",concentration:"Eau de Parfum",recommended:true,
  topNotes:["Pink Pepper","Cardamom"],heartNotes:["Sage","Chestnut"],baseNotes:["Vanilla","Amber","Tonka Bean"],
  longevity:"Long (8-10 hours)", projection:"Strong",
  description:"A more intense, resinous reading of Stronger With You — pink pepper and cardamom deepened by chestnut and vanilla."}));

/* ---------------------------- NEW HOUSES & RELEASES ---------------------------- */
add(P("asdaaf","Asdaaf","Ameerat Al Arab",{gender:"Women",concentration:"Eau de Parfum",
  topNotes:["Citruses","Bergamot"],heartNotes:["White Musk","Aloe Vera"],baseNotes:["Jasmine","Musk","Woody Notes","Oud"],
  description:"A bright feminine floral that moves from sparkling citrus and bergamot through cool aloe vera and white musk into jasmine, soft woods and oud."}));
add(P("asdaaf","Asdaaf","Ameerat Al Arab Prive Rose",{gender:"Women",concentration:"Eau de Parfum",
  topNotes:["Strawberry","Grapes","Orange"],heartNotes:["Rose","White Musk","Jasmine","Ylang-Ylang","Gardenia","Lily"],baseNotes:["Tonka Bean","Amber","Sandalwood"],
  description:"A lush fruity rose with strawberry, grape and orange above a full floral heart, finishing with powdery musk, amber, tonka bean and sandalwood."}));
add(P("azzaro","Azzaro","The Most Wanted Intense EDP",{gender:"Men",concentration:"Eau de Parfum Intense",
  topNotes:["Cardamom"],heartNotes:["Toffee"],baseNotes:["Amberwood"],
  description:"A bold oriental-spicy gourmand for men, combining aromatic cardamom with addictive toffee and a powerful amberwood finish."}));
add(P("azzaro","Azzaro","The Most Wanted Parfum",{gender:"Men",concentration:"Parfum",
  topNotes:["Ginger"],heartNotes:["Woody Notes"],baseNotes:["Bourbon Vanilla"],
  description:"A dark woody-spicy parfum for men, balancing lively ginger with warm woods and a smooth, subtly boozy Bourbon vanilla trail."}));
add(P("ahmed-al-maghribi","Ahmed Al Maghribi","Kaaf",{gender:"Unisex",
  topNotes:["Lavender","Watermelon","Sicilian Orange","Red Fruits"],
  heartNotes:["Lily-of-the-Valley","Jasmine","Lotus","Sea Accord"],
  baseNotes:["White Musk","Ambroxan","Sandalwood"],
  description:"A powerful clean-fruity fresh scent, opening with watermelon, lavender and red fruits before an airy floral heart and musky sandalwood trail."}));
add(P("al-haramain","Al Haramain","Amber Oud Gold Edition",{gender:"Unisex",
  topNotes:["Bergamot","Green Notes"],heartNotes:["Melon","Pineapple","Amber","Gourmand Accord"],baseNotes:["Vanilla","Musk","Woody Notes"],
  description:"A radiant fruity amber with green bergamot, ripe melon and pineapple over a dense vanilla-musk base."}));
add(P("al-haramain","Al Haramain","Aqua Dubai",{gender:"Unisex",
  topNotes:["Bergamot","Green Notes","Mandarin Orange"],heartNotes:["Melon","Amber","Black Currant","Pineapple"],baseNotes:["Musk","Petitgrain","Galbanum","Vanilla"],
  description:"Al Haramain's vivid citrus-fruity extrait pairs mandarin and green bergamot with tropical fruit and a polished musky-vanilla base."}));
add(P("al-wataniah","Al Wataniah","Kayaan Classic",{gender:"Unisex",
  topNotes:["Orange","Bergamot"],heartNotes:["Tuscan Iris","Spices","Jasmine","Rose"],baseNotes:["Vanilla","Sandalwood","Musk","Patchouli"],
  description:"A smooth powdery iris fragrance with bright citrus, soft florals and a warm vanilla-sandalwood dry-down."}));
add(P("calvin-klein","Calvin Klein","Obsession for Women",{gender:"Women",
  topNotes:["Vanilla","Basil","Bergamot","Mandarin Orange","Green Notes","Peach","Lemon"],heartNotes:["Spices","Sandalwood","Coriander","Oakmoss","Cedar","Orange Blossom","Jasmine","Rose"],baseNotes:["Amber","Incense","Vanilla","Civet","Musk","Vetiver"],
  description:"Calvin Klein's iconic warm-spicy amber layers bright citrus and aromatic herbs over incense, civet, musk and a rich vanilla glow."}));
add(P("tubbees","Tubbees","Bubble Gum",{gender:"Unisex",
  topNotes:["Fruits","Clove"],heartNotes:["Bubble Gum","Orange Oil"],baseNotes:["Vanilla","Patchouli","Cashmeran"],
  description:"A playful fruit-and-clove opening melts into nostalgic bubble gum, orange oil and a warm vanilla-cashmeran base."}));
add(P("tubbees","Tubbees","Chocolate Fudge",{gender:"Unisex",
  topNotes:["Dark Chocolate","Hazelnut","Dulce de Leche"],heartNotes:["Chocolate Fudge","Baileys Irish Cream","Caramel","Bitter Almond"],baseNotes:["Praline","Vanilla Absolute","Amberwood","Sandalwood"],
  description:"A photorealistic chocolate gourmand with hazelnut and dulce de leche, a boozy caramel heart and a praline-vanilla finish."}));
add(P("tubbees","Tubbees","Cookies & Cream",{gender:"Unisex",
  topNotes:["Butter","Sugar"],heartNotes:["Milk","Milk Chocolate"],baseNotes:["Vanilla","White Musk"],
  description:"A cozy lactonic gourmand that smells of buttered sugar, milk chocolate, vanilla cream and soft white musk."}));
add(P("tubbees","Tubbees","Cotton Candy",{gender:"Unisex",
  topNotes:["Coconut Milk"],heartNotes:["Cotton Candy","Caramel"],baseNotes:["Musk","Vanilla"],
  description:"A carnival-inspired gourmand of creamy coconut milk, caramelized cotton candy, vanilla and clean musk."}));
add(P("tubbees","Tubbees","Strawberry Cheesecake",{gender:"Women",
  topNotes:["Cheesecake","Strawberry","Vanilla"],heartNotes:["Whipped Cream","Vanilla","Sandalwood"],baseNotes:["Vanilla","Styrax"],
  description:"A creamy strawberry gourmand with a realistic cheesecake accord, whipped cream and a warm vanilla-styrax dry-down."}));
add(P("tubbees","Tubbees","Unicorn Vanilla",{gender:"Unisex",
  topNotes:["Black Currant","Citruses","Acai Berry"],heartNotes:["White Flowers","Matcha Tea","Rose"],baseNotes:["Vanilla","Cotton Candy","Sandalwood"],
  description:"A colorful fruit-and-matcha gourmand that settles into white flowers, fluffy cotton candy, vanilla and sandalwood."}));
add(P("rasasi","Rasasi","Hawas Majestic",{gender:"Unisex",
  topNotes:["Sharp Citrus","Crushed Green Leaves"],heartNotes:["Dry Woods","Mineral Accord"],baseNotes:["Vetiver","Clean Musk","Oakmoss"],
  description:"A newly released green-citrus Hawas flanker with crushed leaves, mineral woods, earthy vetiver and clean musk."}));
add(P("rayhaan","Rayhaan","Pacific Aura",{gender:"Men",
  topNotes:["Citron","Mint","Orange","Lemon","Black Currant","Coriander"],heartNotes:["Apricot","Basil","Carrot Seeds","May Rose"],baseNotes:["Fig","Dates","Ambrette"],
  description:"A cooling citrus-green summer fragrance with mint, black currant and aromatic herbs over fig, dates and soft ambrette."}));

if (typeof module !== "undefined") module.exports = { BRANDS, PRODUCTS };
