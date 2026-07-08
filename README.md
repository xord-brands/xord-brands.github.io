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

- Use `row_type=brand` for brand-only rows.
- Use `row_type=product` for product rows.
- Repeat the brand fields on product rows so the site can group products under each brand.
- Use `brand_id` as the brand identifier and image folder name. This replaces the old `brand_slug` name.
- Use `catalog_category` for the shared top-level catalog category and `product_category` for each product category.
- Put multiple store links in `store_links`, for example `쿠팡=https://...|네이버=https://...|11번가=https://...`.
- Separate product tags with `|`, for example `무드등|선물|캐릭터`.

Image directory convention:

```text
assets/images/brands/{brand_id}/brand-main.png
assets/images/products/{brand_id}/{product_model}/thumbnails/01.png
assets/images/products/{brand_id}/{product_model}/details/01.jpg
```

Do not enter `brand_representative_image`, `product_thumbnail_images`, or `product_detail_images` columns in the CSV. The site automatically tries `png`, `jpg`, `jpeg`, and `webp` files named `brand-main` or `01` through `12`.
