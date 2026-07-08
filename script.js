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

function imageCandidateAttr(candidates) {
  return escapeHtml((candidates || []).join("|"));
}

function imageMarkup(candidates, alt, className = "", removeOnFail = false) {
  const list = (candidates || []).filter(Boolean);
  if (!list.length) return "";
  return `<img${className ? ` class="${escapeHtml(className)}"` : ""} src="${escapeHtml(list[0])}" alt="${escapeHtml(alt)}" data-image-candidates="${imageCandidateAttr(list)}"${removeOnFail ? ' data-remove-on-fail="true"' : ""} />`;
}

function activateCandidateImages(root = document) {
  root.querySelectorAll("img[data-image-candidates]").forEach((image) => {
    if (image.dataset.candidatesReady) return;
    image.dataset.candidatesReady = "true";
    const candidates = image.dataset.imageCandidates.split("|").filter(Boolean);
    let index = Math.max(0, candidates.indexOf(image.getAttribute("src")));

    image.addEventListener("error", () => {
      index += 1;
      if (index < candidates.length) {
        image.src = candidates[index];
        return;
      }

      if (image.dataset.removeOnFail === "true") {
        const removable = image.closest("[data-remove-on-image-fail]");
        if (removable) removable.remove();
      }
    });
  });
}

function brandMatches(brand, query) {
  if (!query) return true;
  const productText = brand.products
    .map((product) => [product.name, product.model, product.category, product.summary, ...(product.tags || [])].join(" "))
    .join(" ");
  return [brand.name, brand.nameKo, brand.status, brand.summary, brand.description, brand.category, productText]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function brandImage(brand) {
  if (brand.imageCandidates && brand.imageCandidates.length) {
    return imageMarkup(brand.imageCandidates, `${brand.nameKo || brand.name} 대표 이미지`);
  }
  return `<div class="brand-fallback" aria-hidden="true">${escapeHtml(brand.name.slice(0, 2))}</div>`;
}

function storeAction(brand) {
  if (!brand.storeLinks || !brand.storeLinks.length) {
    return '<span class="button unavailable">준비중</span>';
  }
  return brand.storeLinks
    .map(
      (link) =>
        `<a class="button solid" href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)} 보기</a>`,
    )
    .join("");
}

function productPreview(brand) {
  if (!brand.products.length) {
    return '<p class="muted">상품 등록 준비중</p>';
  }
  return `
    <div class="preview-row">
      ${brand.products
        .slice(0, 3)
        .map(
          (product) => `
            <a href="${productUrl(product)}" aria-label="${escapeHtml(product.name)} 상세 보기">
              ${imageMarkup(product.imageCandidates, product.name)}
            </a>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderBrandCard(brand) {
  const productSectionId = `products-${brand.slug}`;
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
          <a class="button ghost" href="#${escapeHtml(productSectionId)}" data-brand-link="${escapeHtml(brand.slug)}">전체 상품</a>
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
        ${imageMarkup(product.imageCandidates, product.name)}
      </a>
      <div class="product-body">
        <div class="card-pills">
          <span>${escapeHtml(brand.name)}</span>
          <span>${escapeHtml(product.category)}</span>
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

function renderProductBrandSection(brand) {
  const productCount = brand.products.length;
  const productLabel = productCount ? `${productCount}개 상품` : "상품 준비중";

  return `
    <section class="product-brand-section" id="products-${escapeHtml(brand.slug)}" style="--accent:${escapeHtml(brand.accent)}">
      <div class="product-brand-header">
        <div>
          <div class="card-pills">
            <span>${escapeHtml(brand.status)}</span>
            <span>${escapeHtml(brand.category)}</span>
            <span>${escapeHtml(productLabel)}</span>
          </div>
          <h3>${escapeHtml(brand.name)}<small>${escapeHtml(brand.nameKo)}</small></h3>
          <p>${escapeHtml(brand.description || brand.summary)}</p>
        </div>
        <div class="product-brand-actions">
          ${storeAction(brand)}
        </div>
      </div>
      ${
        productCount
          ? `<div class="product-grid">${brand.products.map((product) => renderProductCard(product, brand)).join("")}</div>`
          : '<div class="empty-state">등록된 상품이 없습니다.</div>'
      }
    </section>
  `;
}

function scrollToCurrentHashTarget() {
  const targetId = decodeURIComponent(window.location.hash.slice(1));
  if (!targetId) return;
  const target = document.getElementById(targetId);
  if (target) target.scrollIntoView({ block: "start" });
}

function scheduleHashScroll() {
  [0, 120, 480].forEach((delay) => {
    window.setTimeout(scrollToCurrentHashTarget, delay);
  });
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
    activateCandidateImages(grid);
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
  productGrid.innerHTML = brands.map(renderProductBrandSection).join("");
  activateCandidateImages(productGrid);
  draw();
  scheduleHashScroll();
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
