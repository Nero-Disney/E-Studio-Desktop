export interface ProductRecord {
  id: string;
  ITEMNAME: string;
  PRODUCT_SCAN?: string;
  PARTNO?: string;
  BRAND_INFO?: string;
  CATEGORY_NAME?: string;
  DEPT_NAME?: string;
  STORE_NAME?: string;
  SELLING_PRICE?: number;
  PROMOPRICE?: number;
  CASE_SIZE?: number;
  UNIT?: string;
  CURRENCY?: string;
  raw?: Record<string, unknown>;
  updatedAt?: string;
}
