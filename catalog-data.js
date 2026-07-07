const XORD_DATA_URL = "data/xord-brands-management.csv?v=20260707-5";

function xordNormalize(value) {
  return String(value || "").toLowerCase().trim();
}

function xordEscapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function xordParseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  row.push(field);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  if (!rows.length) return [];

  const headers = rows[0].map((headerName) => headerName.replace(/^\uFEFF/, "").trim());
  return rows.slice(1).map((values) =>
    headers.reduce((record, headerName, index) => {
      record[headerName] = (values[index] || "").trim();
      return record;
    }, {}),
  );
}

function xordImageList(value) {
  return String(value || "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function xordCsvToCatalog(text) {
  const brands = new Map();
  const rows = xordParseCsv(text);

  rows.forEach((row) => {
    if (!row.brand_slug) return;
    const brand = brands.get(row.brand_slug) || {
      name: row.brand_name,
      nameKo: row.brand_name_ko,
      slug: row.brand_slug,
      status: row.status,
      summary: row.brand_summary,
      description: row.brand_description,
      category: row.brand_category,
      accent: row.brand_accent || "#2f7d77",
      image: row.brand_representative_image || row.brand_image,
      storeUrl: row.store_url,
      products: [],
    };

    brand.name = row.brand_name || brand.name;
    brand.nameKo = row.brand_name_ko || brand.nameKo;
    brand.status = row.status || brand.status;
    brand.summary = row.brand_summary || brand.summary;
    brand.description = row.brand_description || brand.description;
    brand.category = row.brand_category || brand.category;
    brand.accent = row.brand_accent || brand.accent;
    brand.image = row.brand_representative_image || row.brand_image || brand.image;
    brand.storeUrl = row.store_url || brand.storeUrl;

    if (row.row_type === "product" && row.product_name) {
      const thumbnails = xordImageList(row.product_thumbnail_images || row.product_image);
      const detailImages = xordImageList(row.product_detail_images);
      brand.products.push({
        model: row.product_model,
        name: row.product_name,
        summary: row.product_summary,
        image: thumbnails[0] || row.product_image,
        thumbnails,
        detailImages,
        tags: row.product_tags
          ? row.product_tags.split("|").map((tag) => tag.trim()).filter(Boolean)
          : [],
        notes: row.notes,
      });
    }

    brands.set(row.brand_slug, brand);
  });

  return { brands: [...brands.values()] };
}

function xordAllProducts(catalog) {
  return (catalog.brands || []).flatMap((brand) =>
    brand.products.map((product) => ({ product, brand })),
  );
}

function xordProductUrl(product) {
  return `product.html?model=${encodeURIComponent(product.model || product.name)}`;
}

window.XordCatalog = {
  allProducts: xordAllProducts,
  csvToCatalog: xordCsvToCatalog,
  dataUrl: XORD_DATA_URL,
  escapeHtml: xordEscapeHtml,
  normalize: xordNormalize,
  productUrl: xordProductUrl,
};
