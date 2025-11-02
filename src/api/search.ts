// Intelligent search client. Tries backend /api/search, falls back to client-side TF-IDF over fallback data.
import { fetchJobs as fetchJobsFallback } from '@/api/jobs';

// Minimal tokenizer/stopwords for client fallback
const STOPWORDS = new Set([
  'a','an','the','and','or','but','if','then','else','for','of','on','in','to','with','by','at','from','as','is','are','was','were','be','been','being','this','that','these','those','it','its','into','over','under','about','your','you','we','our','their','they'
]);

function tokenize(text: string): string[] {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9+.# ]+/g, ' ')
    .split(/\s+/)
    .filter(t => t && !STOPWORDS.has(t));
}

function buildTf(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
  return tf;
}

function cosineSim(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0, a2 = 0, b2 = 0;
  const all = new Set([...a.keys(), ...b.keys()]);
  for (const k of all) {
    const av = a.get(k) || 0;
    const bv = b.get(k) || 0;
    dot += av * bv; a2 += av * av; b2 += bv * bv;
  }
  if (!a2 || !b2) return 0;
  return dot / (Math.sqrt(a2) * Math.sqrt(b2));
}

export async function smartSearch(params: {
  page?: number;
  limit?: number;
  search?: string;
  location?: string;
  source?: string;
  preferences?: any;
} = {}) {
  const { page = 1, limit = 20, search = '', location = '', source = '', preferences } = params;

  // Try backend first
  try {
    const query = new URLSearchParams();
    query.set('page', String(page));
    query.set('limit', String(limit));
    if (search) query.set('search', search);
    if (location) query.set('location', location);
    if (source) query.set('source', source);
    if (preferences) query.set('preferences', JSON.stringify(preferences));

    // Use relative URL so it works on Vercel and during dev with API routes
    const resp = await fetch(`/api/search?${query.toString()}`);
    if (resp.ok) {
      return await resp.json();
    }
  } catch (e) {
    // fall through to client-side fallback
    console.warn('Backend intelligent search unavailable, using client TF-IDF fallback:', e);
  }

  // Client-side fallback: use existing fallback jobs + TF-like ranking
  const base = await fetchJobsFallback({ page: 1, limit: 500, search, location, source });
  const candidates = base.jobs;

  const qVec = buildTf(tokenize(search || ''));

  function prefBoost(job: any): number {
    let boost = 1;
    const title = (job.title || '').toLowerCase();
    const loc = (job.location || '').toLowerCase();
    const p = preferences || {};

    if (Array.isArray(p.preferredCategories) && p.preferredCategories.length) {
      const hit = p.preferredCategories.some((c: string) => title.includes(String(c).toLowerCase().split(' ')[0]));
      if (hit) boost *= 1.2;
    }
    if (Array.isArray(p.preferredLocations) && p.preferredLocations.length) {
      const hit = p.preferredLocations.some((l: string) => loc.includes(String(l).toLowerCase()));
      if (hit) boost *= 1.15;
    }
    if (p.remoteWork && loc.includes('remote')) boost *= 1.1;
    if (Array.isArray(p.requiredSkills) && p.requiredSkills.length) {
      const hit = p.requiredSkills.some((s: string) => title.includes(String(s).toLowerCase()));
      if (hit) boost *= 1.15;
    }
    if (Array.isArray(p.excludeKeywords) && p.excludeKeywords.length) {
      const bad = p.excludeKeywords.some((k: string) => title.includes(String(k).toLowerCase()));
      if (bad) boost *= 0.7;
    }
    return boost;
  }

  const scored = candidates.map((job: any) => {
    const dVec = buildTf(tokenize(`${job.title} ${job.company} ${job.location}`));
    const baseScore = cosineSim(qVec, dVec);
    const recency = (() => {
      const ts = job.scrapedAt ? new Date(job.scrapedAt).getTime() : 0;
      const now = Date.now();
      const hours = Math.max(1, (now - ts) / (1000 * 60 * 60));
      return 1 / Math.log10(10 + hours);
    })();
    const score = baseScore * 0.7 + recency * 0.1;
    return { job, score: score * prefBoost(job) };
  }).sort((a: any, b: any) => b.score - a.score);

  const start = (page - 1) * limit;
  const end = start + limit;
  const slice = scored.slice(start, end).map((s: any) => s.job);
  const totalJobs = scored.length;
  const totalPages = Math.ceil(totalJobs / limit);

  // Reuse stats from base or compute simple counts
  const stats = candidates.reduce((acc: Record<string, number>, j: any) => {
    acc[j.source] = (acc[j.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    jobs: slice,
    pagination: {
      currentPage: page,
      totalPages,
      totalJobs,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    },
    stats
  };
}
