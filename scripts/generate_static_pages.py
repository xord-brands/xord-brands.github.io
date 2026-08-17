#!/usr/bin/env python3
import csv
import json
import re
from datetime import date
from html import escape
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BASE_URL = "https://xord-brands.github.io"
ASSET_VERSION = "20260817-seo-static-pages"
IMAGE_EXTENSIONS = ("png", "jpg", "jpeg", "webp")


def clean_text(value):
    return " ".join(str(value or "").split())


def slugify(value):
    slug = re.sub(r"[^a-z0-9]+", "-", str(value or "").lower()).strip("-")
    return slug or "product"


def split_list(value):
    return [item.strip() for item in str(value or "").split("|") if item.strip()]


def parse_store_links(value):
    links = []
    for index, item in enumerate(split_list(value), start=1):
        equal_index = item.find("=")
        colon_index = item.find(":")
        separator_index = equal_index if equal_index != -1 else colon_index
        if re.match(r"^https?://", item, re.I) or separator_index == -1:
            label = "스토어" if index == 1 else f"스토어 {index}"
            url = item
        else:
            label = item[:separator_index].strip() or f"스토어 {index}"
            url = item[separator_index + 1 :].strip()
        links.append({"label": label, "url": url})
    return links


def product_slug(product):
    return slugify(product.get("model") or product.get("name"))


def product_url(product):
    return f"{BASE_URL}/products/{product_slug(product)}/"


def relative_asset(path):
    if not path:
        return ""
    if re.match(r"^(data:|blob:|https?://)", path, re.I):
        return path
    return f"../../{path.lstrip('/')}"


def absolute_url(path):
    if not path:
        return ""
    if re.match(r"^https?://", path, re.I):
        return path
    return f"{BASE_URL}/{path.lstrip('/')}"


def existing_path(path):
    if not path or re.match(r"^https?://", path, re.I):
        return True
    return (ROOT / path).exists()


def explicit_images(value):
    return [path for path in split_list(value) if existing_path(path)]


def numbered_images(brand_id, model, image_type, max_index):
    images = []
    for number in range(1, max_index + 1):
        base = f"assets/images/products/{brand_id}/{model}/{image_type}/{number:02d}"
        for extension in IMAGE_EXTENSIONS:
            path = f"{base}.{extension}"
            if (ROOT / path).exists():
                images.append(path)
                break
    return images


def image_list(row, key, image_type, max_index):
    explicit = explicit_images(row.get(key))
    if explicit:
        return explicit
    return numbered_images(row["brand_id"], row["product_model"], image_type, max_index)


def read_catalog():
    rows = []
    with (ROOT / "data" / "xord-brands-management.csv").open(encoding="utf-8-sig", newline="") as file:
        for row in csv.DictReader(file):
            if row.get("row_type") != "product" or not row.get("product_name"):
                continue
            thumbnails = image_list(row, "thumbnail_images", "thumbnails", 4)
            details = image_list(row, "detail_images", "details", 10)
            brand = {
                "id": row.get("brand_id", ""),
                "name": row.get("brand_name", ""),
                "nameKo": row.get("brand_name_ko", ""),
                "status": row.get("status", ""),
                "category": row.get("catalog_category", ""),
                "summary": row.get("brand_summary", ""),
                "description": row.get("brand_description", ""),
                "accent": row.get("brand_accent") or "#2f7d77",
            }
            product = {
                "brand": brand,
                "model": row.get("product_model", ""),
                "name": row.get("product_name", ""),
                "category": row.get("product_category") or row.get("catalog_category", ""),
                "summary": row.get("product_summary", ""),
                "tags": split_list(row.get("product_tags")),
                "storeLinks": parse_store_links(row.get("store_links")),
                "thumbnails": thumbnails,
                "details": details,
            }
            rows.append(product)
    return rows


def meta_description(product):
    brand = product["brand"]
    parts = [
        product.get("summary"),
        product.get("category"),
        product.get("model"),
        brand.get("nameKo") or brand.get("name"),
    ]
    text = clean_text(" ".join(part for part in parts if part))
    if len(text) > 155:
        return text[:152].rstrip() + "..."
    return text or "XORD Brands 상품 상세 정보."


def valid_url(url):
    return bool(re.match(r"^https?://", str(url or ""), re.I))


def render_store_actions(product):
    links = product.get("storeLinks") or []
    valid_links = [link for link in links if valid_url(link.get("url"))]
    if not valid_links:
        return '<span class="button unavailable">스토어 준비중</span>'
    return "\n        ".join(
        f'<a class="button solid" href="{escape(link["url"])}" target="_blank" rel="noreferrer">{escape(link["label"])} 보기</a>'
        for link in valid_links
    )


def render_tag_row(product):
    tags = product.get("tags") or []
    if not tags:
        return ""
    return '<div class="tag-row">\n        ' + "\n        ".join(f"<span>{escape(tag)}</span>" for tag in tags) + "\n      </div>"


def render_thumbnails(product):
    thumbnails = product.get("thumbnails") or []
    if len(thumbnails) <= 1:
        return ""
    return """
      <div class="detail-thumbs" aria-label="상품 썸네일">
""" + "\n".join(
        f'        <a href="{escape(relative_asset(src))}?v={ASSET_VERSION}"><img src="{escape(relative_asset(src))}?v={ASSET_VERSION}" alt="{escape(product["name"])} 썸네일 {index}" loading="lazy" /></a>'
        for index, src in enumerate(thumbnails, start=1)
    ) + """
      </div>"""


def render_detail_images(product):
    details = product.get("details") or []
    if not details:
        return ""
    return """
      <div class="detail-image-stack">
        <div class="section-heading compact">
          <p class="eyebrow">DETAIL IMAGES</p>
          <h2>상품 상세 이미지</h2>
        </div>
""" + "\n".join(
        f'        <figure><img src="{escape(relative_asset(src))}?v={ASSET_VERSION}" alt="{escape(product["name"])} 상세 이미지 {index}" loading="lazy" /></figure>'
        for index, src in enumerate(details, start=1)
    ) + """
      </div>"""


def render_related(product, products):
    related = [
        item
        for item in products
        if item["brand"]["id"] == product["brand"]["id"] and item["model"] != product["model"]
    ][:3]
    if not related:
        body = '<div class="empty-state">같은 브랜드의 다른 상품을 준비 중입니다.</div>'
    else:
        cards = []
        for item in related:
            image = (item.get("thumbnails") or [""])[0]
            image_markup = (
                f'<img src="{escape(relative_asset(image))}?v={ASSET_VERSION}" alt="{escape(item["name"])}" loading="lazy" />'
                if image
                else ""
            )
            cards.append(
                f"""        <article class="product-card" style="--accent:{escape(item["brand"]["accent"])}">
          <a class="product-media" href="../{product_slug(item)}/" aria-label="{escape(item["name"])} 상세 보기">
            {image_markup}
          </a>
          <div class="product-body">
            <div class="card-pills">
              <span>{escape(item["brand"]["name"])}</span>
              <span>{escape(item["category"])}</span>
              <span>{escape(item["model"])}</span>
            </div>
            <h3><a href="../{product_slug(item)}/">{escape(item["name"])}</a></h3>
            <p>{escape(item["summary"])}</p>
            <a class="button solid detail-button" href="../{product_slug(item)}/">상세 보기</a>
          </div>
        </article>"""
            )
        body = "\n".join(cards)
    return f"""
      <section class="related-section" aria-labelledby="related-title">
        <div class="section-heading compact">
          <p class="eyebrow">MORE PRODUCTS</p>
          <h2 id="related-title">같은 브랜드 상품</h2>
        </div>
        <div class="product-grid compact-grid">
{body}
        </div>
      </section>"""


def product_schema(product):
    brand = product["brand"]
    schema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product["name"],
        "brand": {"@type": "Brand", "name": brand.get("nameKo") or brand.get("name")},
        "category": product.get("category"),
        "model": product.get("model"),
        "description": meta_description(product),
        "url": product_url(product),
        "image": [absolute_url(path) for path in (product.get("thumbnails") or []) + (product.get("details") or [])],
    }
    offer_links = [
        link
        for link in product.get("storeLinks", [])
        if valid_url(link.get("url")) and link.get("label") != "소스"
    ]
    if offer_links:
        schema["offers"] = [
            {
                "@type": "Offer",
                "url": link["url"],
                "availability": "https://schema.org/InStock",
                "seller": {"@type": "Organization", "name": brand.get("nameKo") or brand.get("name")},
            }
            for link in offer_links
        ]
    return json.dumps(schema, ensure_ascii=False, indent=2)


def render_product_page(product, products):
    brand = product["brand"]
    title = f"{product['name']} | XORD Brands"
    description = meta_description(product)
    url = product_url(product)
    primary_image = (product.get("thumbnails") or [""])[0]
    image_markup = (
        f'<img class="detail-main-image" src="{escape(relative_asset(primary_image))}?v={ASSET_VERSION}" alt="{escape(product["name"])}" />'
        if primary_image
        else ""
    )
    tags = ", ".join(product.get("tags") or [])
    feature_items = [
        f"{brand.get('nameKo') or brand.get('name')} 브랜드 카탈로그에 등록된 상품입니다.",
        product.get("summary"),
        f"{tags} 키워드로 분류해 관리할 수 있습니다." if tags else "",
    ]
    features = "\n".join(f"            <li>{escape(item)}</li>" for item in feature_items if item)

    return f"""<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{escape(title)}</title>
    <meta name="description" content="{escape(description)}" />
    <link rel="canonical" href="{escape(url)}" />
    <meta property="og:title" content="{escape(title)}" />
    <meta property="og:description" content="{escape(description)}" />
    <meta property="og:url" content="{escape(url)}" />
    <meta property="og:type" content="product" />
    {f'<meta property="og:image" content="{escape(absolute_url(primary_image))}" />' if primary_image else ''}
    <script type="application/ld+json">
{product_schema(product)}
    </script>
    <link rel="stylesheet" href="../../styles.css?v={ASSET_VERSION}" />
  </head>
  <body class="detail-page">
    <header class="site-header is-scrolled" data-header>
      <a class="brand-mark" href="../../index.html" aria-label="XORD Brands 홈">
        <span class="brand-symbol">XO</span>
        <span>
          <strong>XORD</strong>
          <small>Brands</small>
        </span>
      </a>
      <nav class="top-nav" aria-label="주요 메뉴">
        <a href="../../index.html#brands">Brands</a>
        <a href="../../index.html#products">Products</a>
        <a href="../../index.html#contact">Contact</a>
      </nav>
    </header>

    <main class="product-detail-main">
      <nav class="breadcrumb" aria-label="현재 위치">
        <a href="../../index.html">XORD Brands</a>
        <span>/</span>
        <a href="../../index.html#products">Products</a>
      </nav>

      <section class="product-detail">
        <div class="detail-media" style="--accent:{escape(brand["accent"])}">
          {image_markup}
{render_thumbnails(product)}
        </div>
        <div class="detail-copy">
          <div class="card-pills">
            <span>{escape(brand["name"])}</span>
            <span>{escape(brand["status"])}</span>
            <span>{escape(product["model"])}</span>
          </div>
          <h1>{escape(product["name"])}</h1>
          <p class="detail-summary">{escape(product["summary"])}</p>
{render_tag_row(product)}
          <dl class="detail-specs">
            <div>
              <dt>브랜드</dt>
              <dd>{escape(brand.get("nameKo") or brand.get("name"))}</dd>
            </div>
            <div>
              <dt>카테고리</dt>
              <dd>{escape(product.get("category") or brand.get("category"))}</dd>
            </div>
            <div>
              <dt>모델명</dt>
              <dd>{escape(product["model"])}</dd>
            </div>
          </dl>
          <div class="detail-panel">
            <h2>상품 소개</h2>
            <ul>
{features}
            </ul>
          </div>
          <div class="detail-actions">
            <a class="button primary dark" href="../../index.html#products-{escape(brand["id"])}">목록으로</a>
            {render_store_actions(product)}
          </div>
        </div>
{render_detail_images(product)}
      </section>
{render_related(product, products)}
    </main>

    <footer class="site-footer">
      <span>XORD Brands</span>
      <span>© {date.today().year} xord-brands</span>
    </footer>
  </body>
</html>
"""


def render_sitemap(products):
    today = date.today().isoformat()
    urls = [(f"{BASE_URL}/", "1.0")] + [(product_url(product), "0.8") for product in products]
    entries = "\n".join(
        f"""  <url>
    <loc>{escape(url)}</loc>
    <lastmod>{today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>{priority}</priority>
  </url>"""
        for url, priority in urls
    )
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{entries}
</urlset>
"""


def render_robots():
    return f"""User-agent: *
Allow: /

Sitemap: {BASE_URL}/sitemap.xml
"""


def main():
    products = read_catalog()
    slugs = {}
    for product in products:
        slug = product_slug(product)
        if slug in slugs:
            raise ValueError(f"Duplicate product slug: {slug}")
        slugs[slug] = product

    products_dir = ROOT / "products"
    products_dir.mkdir(exist_ok=True)
    for product in products:
        target = products_dir / product_slug(product)
        target.mkdir(parents=True, exist_ok=True)
        (target / "index.html").write_text(render_product_page(product, products), encoding="utf-8")

    (ROOT / "sitemap.xml").write_text(render_sitemap(products), encoding="utf-8")
    (ROOT / "robots.txt").write_text(render_robots(), encoding="utf-8")
    print(f"Generated {len(products)} product pages, sitemap.xml, and robots.txt")


if __name__ == "__main__":
    main()
