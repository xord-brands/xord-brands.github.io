# XORD Brands CSV and Image Guide

## 운영 원본

Windows Excel에서 바로 열어 수정할 파일:

```text
data/xord-brands-management.csv
```

사이트도 이 파일을 직접 읽습니다.

## 이미지 폴더 규칙

```text
assets/images/brands/{brand_slug}/brand-main.png
assets/images/products/{brand_slug}/{product_model}/thumbnails/01.jpg
assets/images/products/{brand_slug}/{product_model}/thumbnails/02.jpg
assets/images/products/{brand_slug}/{product_model}/details/01.jpg
assets/images/products/{brand_slug}/{product_model}/details/02.jpg
```

예시:

```text
assets/images/brands/lootun/brand-main.png
assets/images/products/lootun/LT-001/thumbnails/01.jpg
assets/images/products/lootun/LT-001/details/01.jpg
```

## CSV 주요 컬럼

- `row_type`: `brand` 또는 `product`
- `brand_slug`: 브랜드 고유값. 폴더명과 맞춥니다.
- `brand_representative_image`: 브랜드 카드에 쓰는 대표 이미지
- `product_model`: 상품 고유값. 상품 폴더명과 맞춥니다.
- `product_thumbnail_images`: 상품 목록과 상세 상단 갤러리 이미지. 여러 장은 `|`로 구분
- `product_detail_images`: 상세페이지 하단 상세 이미지. 여러 장은 `|`로 구분
- `product_tags`: 검색/태그용 키워드. 여러 개는 `|`로 구분

## 새 브랜드 추가 순서

1. `assets/images/brands/{brand_slug}/brand-main.png`를 추가합니다.
2. CSV에서 `row_type=brand` 샘플 행을 복사합니다.
3. `brand_slug`, 브랜드명, 설명, `brand_representative_image`를 수정합니다.
4. 상품이 아직 없으면 상품 관련 칸은 비워둡니다.

## 새 상품 추가 순서

1. `assets/images/products/{brand_slug}/{product_model}/thumbnails/`에 썸네일을 넣습니다.
2. `assets/images/products/{brand_slug}/{product_model}/details/`에 상세 이미지를 넣습니다.
3. CSV에서 `row_type=product` 샘플 행을 복사합니다.
4. `product_model`, 상품명, 설명, 이미지 경로, 태그를 수정합니다.
5. 같은 브랜드의 상품 행은 브랜드 관련 칸을 동일하게 유지합니다.
