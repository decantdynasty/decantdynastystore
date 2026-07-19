# Decant Dynasty storefront

This is a responsive, framework-free fragrance storefront. Open `index.html` directly or serve this folder with any static web server.

## Asset locations

- Product photos: `images/products/<brand-id>/<product-slug>.png`
- Optional decant photos: `images/products/<brand-id>/<product-slug>-decant.png`
- Brand logos: `images/brands/<brand-id>.png`
- Future 3D models: `models/` (optimized `.glb` preferred)
- UI sounds: `sounds/` (`click.mp3`, `toggle.mp3`, `search.mp3`, `result.mp3`)

## Catalog editing

### Add a brand

1. Create a lowercase, hyphenated brand ID, such as `al-haramain`.
2. Upload its transparent PNG logo to `images/brands/<brand-id>.png`.
3. Add one matching object to the alphabetical `BRANDS` array near the top of `data.js`.

### Add a product

1. Upload the product PNG to `images/products/<brand-id>/<product-slug>.png`.
2. Add one `P(...)` entry to the matching brand section in `data.js`, including gender, notes and description. The helper automatically converts the product name into a lowercase, hyphenated image path.
3. Optionally upload a second image as `<product-slug>-decant.png`.

Example: `P("al-haramain", "Al Haramain", "Aqua Dubai", {...})` automatically uses `images/products/al-haramain/aqua-dubai.png`.

### Edit inspiration labels

Edit the `INSPIRED_BY` object at the top of `catalog-research.js`. Its key must exactly match `<brand-id>|<product name>`. Add or change a value to show an “Inspired by” label; delete that entire key/value pair when the fragrance is not a dupe.

Example: `"al-haramain|Aqua Dubai":"Louis Vuitton Imagination"`.

### Edit prices

Every product already has a researched price band in the `PRICE_OVERRIDES` section near the top of `data.js`. Change the tier after a product name to move all four sizes together, such as changing `PRICE_TIERS.select` to `PRICE_TIERS.premium`.

The exact 1ml, 2ml, 3ml and 5ml amounts for each tier are in `PRICE_TIERS` immediately above that list. You can edit those four amounts once to update every product using the tier. For a one-off custom price, replace that product's tier with `PH(99, 179, 249, 379)`; the values are 1ml, 2ml, 3ml and 5ml in that order.

The current interactive hero bottle is generated in Three.js and does not require a model file. Missing sound files fail silently, and the footer provides a persistent mute control.
