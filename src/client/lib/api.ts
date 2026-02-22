export interface PageSummary {
  id: number;
  slug: string;
  title: string;
  summary: string;
  category: string;
  updated_at: string;
}

export interface PageFull {
  id: number;
  slug: string;
  title: string;
  content: string;
  summary: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface CategoryInfo {
  category: string;
  image: string | null;
}

export async function fetchPage(slug: string): Promise<PageFull | null> {
  const res = await fetch(`/api/pages/${slug}`);
  if (!res.ok) return null;
  return res.json();
}

export async function fetchPages(query?: string, category?: string): Promise<PageSummary[]> {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (category) params.set("category", category);
  const res = await fetch(`/api/pages?${params}`);
  return res.json();
}

export async function fetchCategories(): Promise<CategoryInfo[]> {
  const res = await fetch("/api/categories");
  return res.json();
}

export async function savePage(
  slug: string,
  data: { title: string; content: string; summary: string; category: string },
  editorKey: string
): Promise<PageFull> {
  const res = await fetch(`/api/pages/${slug}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Editor-Key": editorKey,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Save failed" }));
    throw new Error(err.error || "Save failed");
  }
  return res.json();
}
