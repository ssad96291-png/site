import { createContext, useContext } from "react";
import type { Content, Settings } from "./types";
export interface SiteContextValue {
  settings: Settings;
  content: Content[];
  en: boolean;
  setEn: (value: boolean) => void;
  t: (tr: string, en: string) => string;
  local: (
    item: Content,
    key: "title" | "subtitle" | "summary" | "body",
  ) => string;
}
export const SiteContext = createContext<SiteContextValue>(null!);
export const useSite = () => useContext(SiteContext);
export const contentPath = (item: Content) =>
  `/${({ product: "urunler", project: "projeler", article: "blog", page: "kurumsal", region: "bolgeler", faq: "sikca-sorulan-sorular" } as Record<string, string>)[item.type] || "kurumsal"}/${item.slug}`;
// Upgrade bundled concept art visually without touching a customer's uploaded images.
export function contentImage(item: Content) {
  const original = item.image || "/images/hero.svg";
  if (
    !/^\/images\/(?:product-\d+|project-\d+|article-\d+|hero)\.svg$/.test(
      original,
    )
  )
    return original;
  if (/demir|çelik|ferforje|yangın|metal/i.test(item.title))
    return "/images/metal-gate.svg";
  if (/alüminyum|cephe|ofis|doğrama/i.test(item.title))
    return "/images/aluminium-facade.svg";
  if (/kış bahçesi|giyotin|sürme/i.test(item.title))
    return "/images/original-terrace.png";
  if (/pergola|bahçe|gölge|teras/i.test(item.title))
    return "/images/original-pergola.png";
  return item.type === "project"
    ? "/images/original-terrace.png"
    : "/images/original-balcony.png";
}
