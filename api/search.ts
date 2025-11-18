import { MongoClient } from 'mongodb';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { tokenize, buildTf, cosineSim } from './utils/nlp.ts';
import { normalizeJob, dedupeKey } from './utils/jobs.ts';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

let cachedClient: MongoClient | null = null;
async function connectToDatabase() {
  if (cachedClient) return cachedClient;
  const client = await MongoClient.connect(MONGODB_URI!);
  cachedClient = client;
  return client;
}


export default async function handler(req: VercelRequest, res: VercelResponse) {
  const useRes = typeof (res as any)?.status === 'function';
  const send = (status: number, body: any) => {
    if (useRes) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      return (res as any).status(status).json(body);
    }
    return new Response(JSON.stringify(body), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  };

  // CORS + method
  if (req.method === 'OPTIONS') return send(200, {});
  if (req.method !== 'GET') return send(405, { error: 'Method not allowed' });

  try {
    const client = await connectToDatabase();
    const db = client.db('jobnest');
    const collection = db.collection('raw_jobs');

    // Read query params robustly across runtimes
    const q: Record<string, string> = (() => {
      const anyReq: any = req as any;
      if (anyReq?.query && typeof anyReq.query === 'object') return anyReq.query;
      try {
        const u = new URL(anyReq?.url || '/', 'http://localhost');
        const o: Record<string, string> = {};
        u.searchParams.forEach((v, k) => { o[k] = v; });
        return o;
      } catch {
        return {} as Record<string, string>;
      }
    })();

    const { page = '1', limit = '20', search = '', location = '', source = '', preferences: prefJson = '' } = q;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const query: any = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }
    if (location) query.location = { $regex: location, $options: 'i' };
    if (source) query.source = source;

    // Pull a window of recent docs first to score. If there are many, cap to 500 for performance
    const rawCandidates = await collection
      .find(query)
      .sort({ scrapedAt: -1 })
      .limit(500)
      .toArray();

    // Normalize and de-duplicate
    const seenKeys = new Set<string>();
    const candidates = rawCandidates
      .map(normalizeJob)
      .filter((job) => {
        const key = dedupeKey(job);
        if (seenKeys.has(key)) return false;
        seenKeys.add(key);
        return true;
      });

    const preferences = (() => {
      try { return prefJson ? JSON.parse(prefJson) : {}; } catch { return {}; }
    })();

    const queryTokens = tokenize(String(search || ''));
    const queryTf = buildTf(queryTokens);

    function prefBoost(job: any): { multiplier: number; reasons: string[] } {
      let boost = 1;
      const reasons: string[] = [];
      const title = (job.title || '').toLowerCase();
      const loc = (job.location || '').toLowerCase();

      if (Array.isArray(preferences.preferredCategories) && preferences.preferredCategories.length) {
        const categoryKeywords: Record<string, string[]> = {
          'Software Development': ['developer','software','engineer','frontend','backend','full','stack','react','node','python','java','devops'],
          'Data Science & AI': ['data','machine','learning','ml','ai','scientist','analyst','nlp','vision'],
          'Marketing & Sales': ['marketing','sales','seo','content','growth','performance'],
          'Design & Creative': ['designer','design','ux','ui','graphic','product'],
          'Product Management': ['product','manager','pm']
        };
        const hit = preferences.preferredCategories.some((c: string) => {
          const kws = categoryKeywords[c] || [c.toLowerCase()];
          return kws.some((k: string) => title.includes(k));
        });
        if (hit) { boost *= 1.2; reasons.push('Preference: category match'); }
      }

      if (Array.isArray(preferences.preferredLocations) && preferences.preferredLocations.length) {
        const hit = preferences.preferredLocations.some((l: string) => loc.includes(String(l).toLowerCase()));
        if (hit) { boost *= 1.15; reasons.push('Preference: location match'); }
      }

      if (preferences.remoteWork) {
        if (loc.includes('remote')) { boost *= 1.1; reasons.push('Preference: remote'); }
      }

      if (Array.isArray(preferences.requiredSkills) && preferences.requiredSkills.length) {
        const hit = preferences.requiredSkills.some((s: string) => title.includes(String(s).toLowerCase()));
        if (hit) { boost *= 1.15; reasons.push('Preference: skill match'); }
      }

      if (Array.isArray(preferences.excludeKeywords) && preferences.excludeKeywords.length) {
        const bad = preferences.excludeKeywords.some((k: string) => title.includes(String(k).toLowerCase()));
        if (bad) { boost *= 0.7; reasons.push('Excluded keyword present'); }
      }
      return { multiplier: boost, reasons };
    }

    // Precompute document vectors using TF only (IDF is approximated by token rarity across candidates)
    const docTfs: Map<string, number>[] = [];
    const df = new Map<string, number>();
    for (const job of candidates) {
      const text = `${job.title || ''} ${job.company || ''} ${job.location || ''} ${job.description || ''}`;
      const tokens = tokenize(text);
      const tf = buildTf(tokens);
      docTfs.push(tf);
      const seen = new Set<string>();
      for (const tok of tf.keys()) {
        if (seen.has(tok)) continue;
        seen.add(tok);
        df.set(tok, (df.get(tok) || 0) + 1);
      }
    }

    // Build IDF
    const N = Math.max(1, candidates.length);
    const idf = new Map<string, number>();
    for (const [tok, dfi] of df) {
      idf.set(tok, Math.log((N + 1) / (dfi + 1)) + 1); // smoothed IDF
    }

    function applyIdf(tf: Map<string, number>): Map<string, number> {
      const weighted = new Map<string, number>();
      for (const [k, v] of tf) weighted.set(k, v * (idf.get(k) || 1));
      return weighted;
    }

    const qVec = applyIdf(queryTf);

    const scored = candidates.map((job, idx) => {
      const dVec = applyIdf(docTfs[idx]);
      const base = cosineSim(qVec, dVec);
      const recency = (() => {
        const ts = job.scrapedAt ? new Date(job.scrapedAt).getTime() : 0;
        const now = Date.now();
        const hours = Math.max(1, (now - ts) / (1000 * 60 * 60));
        // More recent => higher score (decay)
        return 1 / Math.log10(10 + hours);
      })();
      const baseScore = base * 0.7 + recency * 0.1;
      const { multiplier, reasons } = prefBoost(job);
      const finalScore = baseScore * multiplier;

      // simple matched terms extraction for explanations
      const docTokens = Array.from(docTfs[idx].keys());
      const matchedTerms = Array.from(new Set(tokenize(String(search || '')).filter(t => docTokens.includes(t))));

      return {
        job,
        score: finalScore,
        subscores: { tfidf: base, recency, pref: multiplier },
        reasons: [
          ...(base > 0 ? ['TF-IDF match'] : []),
          ...(reasons.length ? reasons : []),
        ],
        matchedTerms
      };
    })
    .sort((a, b) => b.score - a.score);

    const totalJobs = scored.length;
    const totalPages = Math.ceil(totalJobs / limitNum);
    const pageItems = scored.slice(skip, skip + limitNum).map(({ job, score, subscores, reasons, matchedTerms }) => ({
      id: job._id,
      title: job.title,
      company: job.company,
      location: job.location,
      jobUrl: job.jobUrl,
      salary: job.salary,
      source: job.source,
      scrapedAt: job.scrapedAt,
      // ML metadata for UI (optional usage)
      score,
      subscores,
      reasons,
      matchedTerms
    }));

    // Basic stats by source
    const stats = scored.reduce((acc: Record<string, number>, { job }) => {
      acc[job.source] = (acc[job.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return send(200, {
      jobs: pageItems,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalJobs,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      },
      stats
    });
  } catch (error) {
    console.error('Search error:', error);
    return send(500, { error: 'Failed to search jobs' });
  }
}
