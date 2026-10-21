import { CatalogBrowser } from "@/components/catalog-browser";

export default async function CatalogPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  return <CatalogBrowser initialQuery={q} />;
}