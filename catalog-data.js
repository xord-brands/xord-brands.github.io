const XORD_DATA_URL = "data/xord-brands-management.csv?v=20260708-3";
const XORD_IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp"];
const XORD_MAX_IMAGE_INDEX = 12;

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

function xordPathSegment(value) {
  return encodeURIComponent(String(value || "").trim());
}

function xordImageCandidates(basePath, fileName) {
  return XORD_IMAGE_EXTENSIONS.map((extension) => `${basePath}/${fileName}.${extension}`);
}

function xordNumberedImageSets(basePath, maxIndex = XORD_MAX_IMAGE_INDEX) {
  return Array.from({ length: maxIndex }, (_, index) => {
    const fileName = String(index + 1).padStart(2, "0");
    return xordImageCandidates(basePath, fileName);
  });
}

function xordBrandImageCandidates(brandId) {
  return xordImageCandidates(`assets/images/brands/${xordPathSegment(brandId)}`, "brand-main");
}

function xordProductImageSets(brandId, productModel, imageType) {
  return xordNumberedImageSets(
    `assets/images/products/${xordPathSegment(brandId)}/${xordPathSegment(productModel)}/${imageType}`,
  );
}

function xordParseStoreLinks(value) {
  return xordImageList(value).map((item, index) => {
    const isBareUrl = /^https?:\/\//i.test(item);
    const equalIndex = item.indexOf("=");
    const colonIndex = item.indexOf(":");
    const separatorIndex = equalIndex !== -1 ? equalIndex : colonIndex;

    if (isBareUrl || separatorIndex === -1) {
      return {
        label: index === 0 ? "스토어" : `스토어 ${index + 1}`,
        url: item.trim(),
      };
    }

    return {
      label: item.slice(0, separatorIndex).trim() || `스토어 ${index + 1}`,
      url: item.slice(separatorIndex + 1).trim(),
    };
  }).filter((link) => link.url);
}

function xordCsvToCatalog(text) {
  const brands = new Map();
  const rows = xordParseCsv(text);

  rows.forEach((row) => {
    const brandId = row.brand_id;
    if (!brandId) return;

    const catalogCategory = row.catalog_category;
    const brandImageCandidates = xordBrandImageCandidates(brandId);
    const storeLinks = xordParseStoreLinks(row.store_links);
    const brand = brands.get(brandId) || {
      name: row.brand_name,
      nameKo: row.brand_name_ko,
      id: brandId,
      slug: brandId,
      status: row.status,
      summary: row.brand_summary,
      description: row.brand_description,
      category: catalogCategory,
      accent: row.brand_accent || "#2f7d77",
      image: brandImageCandidates[0],
      imageCandidates: brandImageCandidates,
      storeLinks,
      products: [],
    };

    brand.name = row.brand_name || brand.name;
    brand.nameKo = row.brand_name_ko || brand.nameKo;
    brand.status = row.status || brand.status;
    brand.summary = row.brand_summary || brand.summary;
    brand.description = row.brand_description || brand.description;
    brand.category = catalogCategory || brand.category;
    brand.accent = row.brand_accent || brand.accent;
    brand.image = brandImageCandidates[0];
    brand.imageCandidates = brandImageCandidates;
    brand.storeLinks = storeLinks.length ? storeLinks : brand.storeLinks;

    if (row.row_type === "product" && row.product_name) {
      const thumbnailImageSets = xordProductImageSets(brandId, row.product_model, "thumbnails");
      const detailImageSets = xordProductImageSets(brandId, row.product_model, "details");
      brand.products.push({
        model: row.product_model,
        name: row.product_name,
        category: row.product_category || catalogCategory,
        summary: row.product_summary,
        image: thumbnailImageSets[0][0],
        imageCandidates: thumbnailImageSets[0],
        thumbnailImageSets,
        detailImageSets,
        storeLinks,
        tags: row.product_tags
          ? row.product_tags.split("|").map((tag) => tag.trim()).filter(Boolean)
          : [],
      });
    }

    brands.set(brandId, brand);
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
