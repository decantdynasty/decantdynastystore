# Decant Dynasty storefront

This is a responsive, framework-free fragrance storefront. Open `index.html` directly or serve this folder with any static web server.

## Asset locations

- Product photos: `images/products/<brand-id>/<product-slug>.jpg`
- Optional decant photos: `images/products/<brand-id>/<product-slug>-decant.jpg`
- Brand logos: `images/brands/<brand-id>.png`
- Future 3D models: `models/` (optimized `.glb` preferred)
- UI sounds: `sounds/` (`click.mp3`, `toggle.mp3`, `search.mp3`, `result.mp3`)

To add a product, upload its image and add one `P(...)` entry to `data.js`. The helper automatically derives the two product image paths from its brand ID and name. To add a brand, upload its transparent logo and update the `BRANDS` array in `data.js`.

The current interactive hero bottle is generated in Three.js and does not require a model file. Missing sound files fail silently, and the footer provides a persistent mute control.
