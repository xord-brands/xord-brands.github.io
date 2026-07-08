# XORD Brands CSV and Image Guide

## 운영 원본

Windows Excel에서 바로 열어 수정할 파일:

```text
data/xord-brands-management.csv
```

사이트도 이 파일을 직접 읽습니다.

## 이미지 폴더 규칙

CSV에는 이미지 경로를 입력하지 않습니다. `brand_representative_image`, `product_thumbnail_images`, `product_detail_images` 같은 이미지 경로 컬럼도 만들지 않습니다. 사이트가 `brand_id`와 `product_model`로 아래 경로를 자동 생성합니다.

```text
assets/images/brands/{brand_id}/brand-main.png
assets/images/brands/{brand_id}/brand-main.jpg
assets/images/brands/{brand_id}/brand-main.webp
assets/images/products/{brand_id}/{product_model}/thumbnails/01.png
assets/images/products/{brand_id}/{product_model}/thumbnails/02.jpg
assets/images/products/{brand_id}/{product_model}/details/01.jpg
assets/images/products/{brand_id}/{product_model}/details/02.png
```

예시:

```text
assets/images/brands/BlueLee/brand-main.png
assets/images/products/BlueLee/BLCM-001/thumbnails/01.png
assets/images/products/BlueLee/BLCM-001/details/01.jpg
```

지원 확장자는 `png`, `jpg`, `jpeg`, `webp`입니다. 상품 썸네일과 상세 이미지는 `01`부터 `12`까지 자동 탐색합니다.

## CSV 주요 컬럼

- `row_type`: `brand` 또는 `product`
- `brand_id`: 브랜드 고유값. 기존 `brand_slug` 대신 이 이름을 사용하며 이미지 폴더명과 맞춥니다.
- `catalog_category`: 브랜드와 상품을 묶는 상위 카탈로그 카테고리
- `store_links`: 외부 판매처 링크. 여러 개는 `|`로 구분하고 `쿠팡=https://...|네이버=https://...|11번가=https://...`처럼 입력
- `product_model`: 상품 고유값. 상품 폴더명과 맞춥니다.
- `product_category`: 상품 개별 카테고리
- `product_tags`: 검색/태그용 키워드. 여러 개는 `|`로 구분

## 새 브랜드 추가 순서

1. `assets/images/brands/{brand_id}/brand-main.png`를 추가합니다.
2. CSV에서 `row_type=brand` 샘플 행을 복사합니다.
3. `brand_id`, 브랜드명, 설명, 브랜드 카테고리, 판매처 링크를 수정합니다.
4. 상품이 아직 없으면 상품 관련 칸은 비워둡니다.

## 새 상품 추가 순서

1. `assets/images/products/{brand_id}/{product_model}/thumbnails/`에 썸네일을 넣습니다.
2. `assets/images/products/{brand_id}/{product_model}/details/`에 상세 이미지를 넣습니다.
3. CSV에서 `row_type=product` 샘플 행을 복사합니다.
4. `product_model`, 상품명, 상품 카테고리, 설명, 태그를 수정합니다.
5. 같은 브랜드의 상품 행은 브랜드 관련 칸을 동일하게 유지합니다.
