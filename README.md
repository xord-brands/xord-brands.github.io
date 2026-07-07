# XORD Brands

Static GitHub Pages site for the `xord-brands` brand catalog.

Production URL:

```text
https://xord-brands.github.io/
```

Repository:

```text
git@github-xord-brands-pages:xord-brands/xord-brands.github.io.git
```

## Catalog data

Edit the CSV file below in Excel, Google Sheets, or LibreOffice. The site reads this file directly.

```text
data/xord-brands-management.csv
```

This CSV is saved as UTF-8 with BOM so Windows Excel can open Korean text without mojibake.

Developer mirror:

```text
data/catalog.csv
```

- Use `row_type=brand` for brand-only rows.
- Use `row_type=product` for product rows.
- Repeat the brand fields on product rows so the site can group products under each brand.
- Use `brand_representative_image` for each brand's standalone main image.
- Separate multiple product thumbnail images with `|`.
- Separate multiple product detail images with `|`.
- Separate product tags with `|`, for example `무드등|선물|캐릭터`.

Image directory convention:

```text
assets/images/brands/{brand_slug}/brand-main.png
assets/images/products/{brand_slug}/{product_model}/thumbnails/01.jpg
assets/images/products/{brand_slug}/{product_model}/details/01.jpg
```
