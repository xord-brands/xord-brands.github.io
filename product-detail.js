const { allProducts, csvToCatalog, dataUrl, escapeHtml, productUrl } = window.XordCatalog;

const detailYearTarget = document.getElementById("year");
if (detailYearTarget) {
  detailYearTarget.textContent = String(new Date().getFullYear());
}

function getRequestedModel() {
  const params = new URLSearchParams(window.location.search);
  return (params.get("model") || "").trim().toLowerCase();
}

function productFeatures(product, brand) {
  const tags = product.tags || [];
  return [
    `${brand.nameKo || brand.name} 브랜드 카탈로그에 등록된 대표 상품입니다.`,
    product.summary,
    tags.length ? `${tags.join(", ")} 키워드로 분류해 관리할 수 있습니다.` : "",
  ].filter(Boolean);
}

function renderDetail(product, brand) {
  document.title = `${product.name} | XORD Brands`;
  const detail = document.getElementById("product-detail");
  if (!detail) return;

  const features = productFeatures(product, brand);
  detail.innerHTML = `
    <div class="detail-media" style="--accent:${escapeHtml(brand.accent)}">
      <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" />
    </div>
    <div class="detail-copy">
      <div class="card-pills">
        <span>${escapeHtml(brand.name)}</span>
        <span>${escapeHtml(brand.status)}</span>
        <span>${escapeHtml(product.model)}</span>
      </div>
      <h1>${escapeHtml(product.name)}</h1>
      <p class="detail-summary">${escapeHtml(product.summary)}</p>
      <div class="tag-row">
        ${(product.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
      </div>
      <dl class="detail-specs">
        <div>
          <dt>브랜드</dt>
          <dd>${escapeHtml(brand.nameKo || brand.name)}</dd>
        </div>
        <div>
          <dt>카테고리</dt>
          <dd>${escapeHtml(brand.category)}</dd>
        </div>
        <div>
          <dt>모델명</dt>
          <dd>${escapeHtml(product.model)}</dd>
        </div>
      </dl>
      <div class="detail-panel">
        <h2>상품 소개</h2>
        <ul>
          ${features.map((feature) => `<li>${escapeHtml(feature)}</li>`).join("")}
        </ul>
      </div>
      <div class="detail-actions">
        <a class="button primary dark" href="index.html#products">목록으로</a>
        ${
          brand.storeUrl
            ? `<a class="button solid" href="${escapeHtml(brand.storeUrl)}" target="_blank" rel="noreferrer">스토어 보기</a>`
            : '<span class="button unavailable">스토어 준비중</span>'
        }
      </div>
    </div>
  `;
}

function renderRelated(catalog, currentProduct, currentBrand) {
  const related = document.getElementById("related-products");
  if (!related) return;

  const products = currentBrand.products
    .filter((product) => product.model !== currentProduct.model)
    .slice(0, 3);

  if (!products.length) {
    related.innerHTML = '<div class="empty-state">같은 브랜드의 다른 상품을 준비 중입니다.</div>';
    return;
  }

  related.innerHTML = products
    .map(
      (product) => `
        <article class="product-card" style="--accent:${escapeHtml(currentBrand.accent)}">
          <a class="product-media" href="${productUrl(product)}" aria-label="${escapeHtml(product.name)} 상세 보기">
            <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" />
          </a>
          <div class="product-body">
            <div class="card-pills">
              <span>${escapeHtml(currentBrand.name)}</span>
              <span>${escapeHtml(product.model)}</span>
            </div>
            <h3><a href="${productUrl(product)}">${escapeHtml(product.name)}</a></h3>
            <p>${escapeHtml(product.summary)}</p>
            <a class="button solid detail-button" href="${productUrl(product)}">상세 보기</a>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderNotFound(catalog) {
  const detail = document.getElementById("product-detail");
  if (!detail) return;
  const firstProduct = allProducts(catalog)[0];

  detail.innerHTML = `
    <div class="empty-state detail-empty">
      상품을 찾지 못했습니다.
      ${
        firstProduct
          ? `<a class="button solid" href="${productUrl(firstProduct.product)}">샘플 상품 보기</a>`
          : '<a class="button solid" href="index.html">첫 페이지로</a>'
      }
    </div>
  `;
}

fetch(dataUrl)
  .then((response) => {
    if (!response.ok) throw new Error(`Catalog load failed: ${response.status}`);
    return response.text();
  })
  .then(csvToCatalog)
  .then((catalog) => {
    const requestedModel = getRequestedModel();
    const matched = allProducts(catalog).find(
      ({ product }) => String(product.model || "").toLowerCase() === requestedModel,
    );

    if (!matched) {
      renderNotFound(catalog);
      return;
    }

    renderDetail(matched.product, matched.brand);
    renderRelated(catalog, matched.product, matched.brand);
  })
  .catch(() => {
    const detail = document.getElementById("product-detail");
    if (detail) detail.innerHTML = '<div class="empty-state">상품 데이터를 불러오지 못했습니다.</div>';
  });
