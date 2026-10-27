export interface Spec {
  label: string;
  value: string;
}
export interface Content {
  id: string;
  type: string;
  slug: string;
  title: string;
  subtitle: string;
  summary: string;
  body: string;
  image: string;
  category: string;
  featured: boolean;
  published: boolean;
  sortOrder: number;
  specs: Spec[];
  gallery: string[];
  titleEn?: string;
  subtitleEn?: string;
  summaryEn?: string;
  bodyEn?: string;
  seoTitle?: string;
  seoDescription?: string;
  imageAlt?: string;
  createdAt: string;
  updatedAt: string;
}
export interface Settings {
  [key: string]: unknown;
  logoText: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  workingHours: string;
  instagram: string;
  facebook: string;
  youtube: string;
  linkedin: string;
  heroTitle: string;
  heroSubtitle: string;
  heroEyebrow: string;
  aboutText: string;
  serviceAreas: string;
  languages: string[];
}
