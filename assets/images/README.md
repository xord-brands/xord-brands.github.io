# Image Directory Guide

Brand representative images:

```text
assets/images/brands/{brand_id}/brand-main.png
```

Product thumbnails:

```text
assets/images/products/{brand_id}/{product_model}/thumbnails/01.png
assets/images/products/{brand_id}/{product_model}/thumbnails/02.png
```

Product detail page images:

```text
assets/images/products/{brand_id}/{product_model}/details/01.jpg
assets/images/products/{brand_id}/{product_model}/details/02.jpg
```

Match `{brand_id}` and `{product_model}` with the CSV values in:

```text
data/xord-brands-management.csv
```

Do not enter image paths in the CSV. The site automatically tries `png`, `jpg`, `jpeg`, and `webp` files named `brand-main` or `01` through `12`.
