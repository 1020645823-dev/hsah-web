/**
 * Fixed option lists for asset classification tags (cloud / industry / technology).
 *
 * The backend stores these as free-form string arrays, but the editor constrains
 * input to these taxonomies for consistency. Values are stable identifiers
 * (English, lowercase, hyphen-separated) so they stay queryable; labels provide
 * localized display via the i18n catalog under `Admin.taxonomy.*`.
 */

export type TaxonomyOption = {
  /** Stable identifier stored on the asset. */
  value: string;
  /** i18n key suffix under `Admin.taxonomy.<group>.*`. */
  labelKey: string;
};

export const CLOUD_PROVIDER_OPTIONS: TaxonomyOption[] = [
  "aws",
  "azure",
  "gcp",
  "aliyun",
  "huaweicloud",
  "tencentcloud",
  "baidubce",
  "oracle",
  "ibm-cloud",
  "volcengine",
].map((value) => ({ value, labelKey: `cloud.${value}` }));

export const INDUSTRY_OPTIONS: TaxonomyOption[] = [
  "financial-services",
  "healthcare",
  "manufacturing",
  "retail",
  "telecommunications",
  "energy",
  "public-sector",
  "consumer-goods",
  "transportation-logistics",
  "high-tech",
  "media",
  "education",
  "natural-resources",
].map((value) => ({ value, labelKey: `industry.${value}` }));

export const TECHNOLOGY_OPTIONS: TaxonomyOption[] = [
  "genai",
  "ai-ml",
  "kubernetes",
  "cloud-native",
  "microservices",
  "serverless",
  "data-platform",
  "big-data",
  "observability",
  "security-compliance",
  "iot",
  "blockchain",
].map((value) => ({ value, labelKey: `technology.${value}` }));
