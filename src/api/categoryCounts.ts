export async function fetchCategoryCounts(): Promise<Record<string, number> | null> {
  try {
    const resp = await fetch('/api/category-counts');
    if (!resp.ok) return null;
    const data = await resp.json();
    return (data?.counts ?? null) as Record<string, number> | null;
  } catch {
    return null;
  }
}
