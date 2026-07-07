const DATA_URL = "data/catalog.csv?v=20260707-2";
const yearTarget = document.getElementById("year");
const header = document.querySelector("[data-header]");

if (yearTarget) {
  yearTarget.textContent = String(new Date().getFullYear());
}

if (header) {
  const syncHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 12);
  syncHeader();
  window.addEventListener("scroll", syncHeader, { passive: true });
}

function normalize(value) {
  return String(value || "").toLowerCase().trim();
}

function parseCsv(text) {
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

function csvToCatalog(text) {
  const brands = new Map();
  const rows = parseCsv(text);

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
      image: row.brand_image,
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
    brand.image = row.brand_image || brand.image;
    brand.storeUrl = row.store_url || brand.storeUrl;

    if (row.row_type === "product" && row.product_name) {
      brand.products.push({
        model: row.product_model,
        name: row.product_name,
        summary: row.product_summary,
        image: row.product_image,
        tags: row.product_tags
          ? row.product_tags.split("|").map((tag) => tag.trim()).filter(Boolean)
          : [],
      });
    }

    brands.set(row.brand_slug, brand);
  });

  return { brands: [...brands.values()] };
}

function brandMatches(brand, query) {
  if (!query) return true;
  const productText = brand.products
    .map((product) => [product.name, product.model, product.summary, ...(product.tags || [])].join(" "))
    .join(" ");
  return [brand.name, brand.nameKo, brand.status, brand.summary, brand.description, brand.category, productText]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function brandImage(brand) {
  if (brand.image) {
    return `<img src="${brand.image}" alt="${brand.nameKo || brand.name} 대표 이미지" />`;
  }
  return `<div class="brand-fallback" aria-hidden="true">${brand.name.slice(0, 2)}</div>`;
}

function storeAction(brand) {
  if (!brand.storeUrl) {
    return '<span class="button unavailable">준비중</span>';
  }
  return `<a class="button solid" href="${brand.storeUrl}" target="_blank" rel="noreferrer">스토어 보기</a>`;
}

function productPreview(brand) {
  if (!brand.products.length) {
    return '<p class="muted">대표 상품 등록 준비중</p>';
  }
  return `
    <div class="preview-row">
      ${brand.products
        .slice(0, 3)
        .map(
          (product) => `
            <span>
              <img src="${product.image}" alt="${product.name}" />
            </span>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderBrandCard(brand) {
  return `
    <article class="brand-card" style="--accent:${brand.accent}">
      <div class="brand-card-media">${brandImage(brand)}</div>
      <div class="brand-card-body">
        <div class="card-pills">
          <span>${brand.status}</span>
          <span>${brand.category}</span>
        </div>
        <h3>${brand.name}<small>${brand.nameKo}</small></h3>
        <p>${brand.summary}</p>
        ${productPreview(brand)}
        <div class="card-actions">
          <a class="button ghost" href="#products" data-brand-link="${brand.slug}">대표 상품</a>
          ${storeAction(brand)}
        </div>
      </div>
    </article>
  `;
}

function renderProductCard(product, brand) {
  return `
    <article class="product-card" style="--accent:${brand.accent}">
      <div class="product-media">
        <img src="${product.image}" alt="${product.name}" />
      </div>
      <div class="product-body">
        <div class="card-pills">
          <span>${brand.name}</span>
          <span>${product.model}</span>
        </div>
        <h3>${product.name}</h3>
        <p>${product.summary}</p>
        <div class="tag-row">
          ${(product.tags || []).map((tag) => `<span>${tag}</span>`).join("")}
        </div>
      </div>
    </article>
  `;
}

function render(data) {
  const brands = data.brands || [];
  const grid = document.getElementById("brand-grid");
  const productGrid = document.getElementById("product-grid");
  const tabs = document.getElementById("filter-tabs");
  const search = document.getElementById("catalog-search");
  const statusLine = document.getElementById("status-line");
  const brandCount = document.getElementById("brand-count");
  const productCount = document.getElementById("product-count");
  if (!grid || !productGrid || !tabs || !search || !statusLine) return;

  const statuses = ["전체", ...new Set(brands.map((brand) => brand.status))];
  let activeStatus = "전체";

  const allProducts = brands.flatMap((brand) =>
    brand.products.map((product) => ({ product, brand })),
  );

  if (brandCount) brandCount.textContent = String(brands.length).padStart(2, "0");
  if (productCount) productCount.textContent = String(allProducts.length).padStart(2, "0");

  tabs.innerHTML = statuses
    .map(
      (status) =>
        `<button class="tab-button${status === activeStatus ? " is-active" : ""}" type="button" data-status="${status}">${status}</button>`,
    )
    .join("");

  const draw = () => {
    const query = normalize(search.value);
    const filtered = brands.filter((brand) => {
      const statusMatch = activeStatus === "전체" || brand.status === activeStatus;
      return statusMatch && brandMatches(brand, query);
    });

    grid.innerHTML = filtered.map(renderBrandCard).join("");
    statusLine.textContent = `${filtered.length}개 브랜드`;

    if (!filtered.length) {
      grid.innerHTML = '<div class="empty-state">조건에 맞는 브랜드가 없습니다.</div>';
    }
  };

  tabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-status]");
    if (!button) return;
    activeStatus = button.dataset.status;
    tabs.querySelectorAll(".tab-button").forEach((tab) => {
      tab.classList.toggle("is-active", tab === button);
    });
    draw();
  });

  search.addEventListener("input", draw);
  productGrid.innerHTML = allProducts
    .map(({ product, brand }) => renderProductCard(product, brand))
    .join("");
  draw();
}

fetch(DATA_URL)
  .then((response) => {
    if (!response.ok) throw new Error(`Catalog load failed: ${response.status}`);
    return response.text();
  })
  .then(csvToCatalog)
  .then(render)
  .catch(() => {
    const statusLine = document.getElementById("status-line");
    if (statusLine) statusLine.textContent = "카탈로그 데이터를 불러오지 못했습니다.";
  });
