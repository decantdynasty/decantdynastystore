/* Storefront extras kept separate from the core fragrance research data. */
globalThis.DECANT_DEFAULT_SETTINGS = {
  paymentLogisticsImage: "images/payment-logistics.png",
  analyticsMeasurementId: ""
};

globalThis.DECANT_DEFAULT_BUNDLES = [
  {
    id: "beginner-collection",
    name: "Beginner Collection",
    description: "Four approachable signatures spanning fresh, warm, polished, and evening-ready profiles.",
    price: 399,
    size: "2ml",
    productIds: ["afnan-0002", "lattafa-0038", "versace-0021", "rasasi-0098"],
    active: true
  },
  {
    id: "office-rotation",
    name: "Office Rotation",
    description: "Clean, composed fragrances chosen to stay polished from first meeting to clock-out.",
    price: 389,
    size: "2ml",
    productIds: ["lattafa-0036", "afnan-0008", "armaf-0012", "maison-alhambra-0096"],
    active: true
  },
  {
    id: "date-night-selection",
    name: "Date Night Selection",
    description: "A confident rotation of warm, magnetic scents made for evenings and close encounters.",
    price: 419,
    size: "2ml",
    productIds: ["afnan-0002", "french-avenue-0079", "versace-0021", "lattafa-0038"],
    active: true
  },
  {
    id: "fresh-summer-set",
    name: "Fresh Summer Set",
    description: "Bright, cooling fragrances selected for warm commutes, weekends, and tropical weather.",
    price: 389,
    size: "2ml",
    productIds: ["rasasi-0098", "afnan-0008", "lattafa-0043", "armaf-0012"],
    active: true
  },
  {
    id: "middle-eastern-starter-kit",
    name: "Middle Eastern Starter Kit",
    description: "Four modern Middle Eastern favorites that show the range of the region's perfumery.",
    price: 389,
    size: "2ml",
    productIds: ["lattafa-0038", "afnan-0002", "afnan-0008", "lattafa-0027"],
    active: true
  },
  {
    id: "personalized-four",
    name: "Your Four-Scent Edit",
    description: "Choose any four available fragrances and build your own personalized 2ml discovery set.",
    price: 399,
    size: "2ml",
    productIds: [],
    customizable: true,
    selectionCount: 4,
    active: true
  }
];
