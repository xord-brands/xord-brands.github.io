const { allProducts, csvToCatalog, dataUrl, escapeHtml, normalize, productUrl } =
  window.XordCatalog;

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
    return `<img src="${escapeHtml(brand.image)}" alt="${escapeHtml(brand.nameKo || brand.name)} 대표 이미지" />`;
  }
  return `<div class="brand-fallback" aria-hidden="true">${escapeHtml(brand.name.slice(0, 2))}</div>`;
}

function storeAction(brand) {
  if (!brand.storeUrl) {
    return '<span class="button unavailable">준비중</span>';
  }
  return `<a class="button solid" href="${escapeHtml(brand.storeUrl)}" target="_blank" rel="noreferrer">스토어 보기</a>`;
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
            <a href="${productUrl(product)}" aria-label="${escapeHtml(product.name)} 상세 보기">
              <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" />
            </a>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderBrandCard(brand) {
  return `
    <article class="brand-card" style="--accent:${escapeHtml(brand.accent)}">
      <div class="brand-card-media">${brandImage(brand)}</div>
      <div class="brand-card-body">
        <div class="card-pills">
          <span>${escapeHtml(brand.status)}</span>
          <span>${escapeHtml(brand.category)}</span>
        </div>
        <h3>${escapeHtml(brand.name)}<small>${escapeHtml(brand.nameKo)}</small></h3>
        <p>${escapeHtml(brand.summary)}</p>
        ${productPreview(brand)}
        <div class="card-actions">
          <a class="button ghost" href="#products" data-brand-link="${escapeHtml(brand.slug)}">대표 상품</a>
          ${storeAction(brand)}
        </div>
      </div>
    </article>
  `;
}

function renderProductCard(product, brand) {
  return `
    <article class="product-card" style="--accent:${escapeHtml(brand.accent)}">
      <a class="product-media" href="${productUrl(product)}" aria-label="${escapeHtml(product.name)} 상세 보기">
        <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" />
      </a>
      <div class="product-body">
        <div class="card-pills">
          <span>${escapeHtml(brand.name)}</span>
          <span>${escapeHtml(product.model)}</span>
        </div>
        <h3><a href="${productUrl(product)}">${escapeHtml(product.name)}</a></h3>
        <p>${escapeHtml(product.summary)}</p>
        <div class="tag-row">
          ${(product.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
        </div>
        <a class="button solid detail-button" href="${productUrl(product)}">상세 보기</a>
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
  const products = allProducts(data);

  if (brandCount) brandCount.textContent = String(brands.length).padStart(2, "0");
  if (productCount) productCount.textContent = String(products.length).padStart(2, "0");

  tabs.innerHTML = statuses
    .map(
      (status) =>
        `<button class="tab-button${status === activeStatus ? " is-active" : ""}" type="button" data-status="${escapeHtml(status)}">${escapeHtml(status)}</button>`,
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
  productGrid.innerHTML = products
    .map(({ product, brand }) => renderProductCard(product, brand))
    .join("");
  draw();
}

fetch(dataUrl)
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
