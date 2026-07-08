const { allProducts, csvToCatalog, dataUrl, escapeHtml, productUrl } = window.XordCatalog;

const detailYearTarget = document.getElementById("year");
if (detailYearTarget) {
  detailYearTarget.textContent = String(new Date().getFullYear());
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

function getRequestedModel() {
  const params = new URLSearchParams(window.location.search);
  return (params.get("model") || "").trim().toLowerCase();
}

function productFeatures(product, brand) {
  const tags = product.tags || [];
  return [
    `${brand.nameKo || brand.name} 브랜드 카탈로그에 등록된 상품입니다.`,
    product.summary,
    tags.length ? `${tags.join(", ")} 키워드로 분류해 관리할 수 있습니다.` : "",
  ].filter(Boolean);
}

function renderDetail(product, brand) {
  document.title = `${product.name} | XORD Brands`;
  const detail = document.getElementById("product-detail");
  if (!detail) return;

  const features = productFeatures(product, brand);
  const thumbnailImageSets = product.thumbnailImageSets || [product.imageCandidates || [product.image].filter(Boolean)];
  const detailImageSets = product.detailImageSets || [];
  const storeLinks = product.storeLinks && product.storeLinks.length ? product.storeLinks : brand.storeLinks || [];
  detail.innerHTML = `
    <div class="detail-media" style="--accent:${escapeHtml(brand.accent)}">
      ${imageMarkup(thumbnailImageSets[0], product.name, "detail-main-image")}
      ${
        thumbnailImageSets.length > 1
          ? `<div class="detail-thumbs" aria-label="상품 썸네일">
              ${thumbnailImageSets
                .map(
                  (candidates, index) => `
                    <a href="${escapeHtml(candidates[0])}" data-remove-on-image-fail>
                      ${imageMarkup(candidates, `${product.name} 썸네일 ${index + 1}`, "", true)}
                    </a>
                  `,
                )
                .join("")}
            </div>`
          : ""
      }
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
          <dd>${escapeHtml(product.category || brand.category)}</dd>
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
        <a class="button primary dark" href="index.html#products-${escapeHtml(brand.slug)}">목록으로</a>
        ${
          storeLinks.length
            ? storeLinks
                .map(
                  (link) =>
                    `<a class="button solid" href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)} 보기</a>`,
                )
                .join("")
            : '<span class="button unavailable">스토어 준비중</span>'
        }
      </div>
    </div>
    ${
      detailImageSets.length
        ? `<div class="detail-image-stack">
            <div class="section-heading compact">
              <p class="eyebrow">DETAIL IMAGES</p>
              <h2>상품 상세 이미지</h2>
            </div>
            ${detailImageSets
              .map(
                (candidates, index) => `
                  <figure data-remove-on-image-fail>
                    ${imageMarkup(candidates, `${product.name} 상세 이미지 ${index + 1}`, "", true)}
                  </figure>
                `,
              )
              .join("")}
          </div>`
        : ""
    }
  `;
  activateCandidateImages(detail);
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
            ${imageMarkup(product.imageCandidates, product.name)}
          </a>
          <div class="product-body">
            <div class="card-pills">
              <span>${escapeHtml(currentBrand.name)}</span>
              <span>${escapeHtml(product.category)}</span>
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
  activateCandidateImages(related);
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
          ? `<a class="button solid" href="${productUrl(firstProduct.product)}">첫 상품 보기</a>`
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
