import { MongoClient } from 'mongodb';
import type { VercelRequest, VercelResponse } from '@vercel/node';

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

// Very simple English stopword list
const STOPWORDS = new Set([
  'a','an','the','and','or','but','if','then','else','for','of','on','in','to','with','by','at','from','as','is','are','was','were','be','been','being','this','that','these','those','it','its','into','over','under','about','your','you','we','our','their','they'
]);

function tokenize(text: string): string[] {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9+.# ]+/g, ' ') // keep tech tokens like c++, node.js
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
  const allKeys = new Set([...a.keys(), ...b.keys()]);
  for (const k of allKeys) {
    const av = a.get(k) || 0;
    const bv = b.get(k) || 0;
    dot += av * bv;
    a2 += av * av;
    b2 += bv * bv;
  }
  if (a2 === 0 || b2 === 0) return 0;
  return dot / (Math.sqrt(a2) * Math.sqrt(b2));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const client = await connectToDatabase();
    const db = client.db('jobnest');
    const collection = db.collection('raw_jobs');

    const { page = '1', limit = '20', search = '', location = '', source = '', preferences: prefJson = '' } = req.query as Record<string, string>;

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
    const candidates = await collection
      .find(query)
      .sort({ scrapedAt: -1 })
      .limit(500)
      .toArray();

    const preferences = (() => {
      try { return prefJson ? JSON.parse(prefJson) : {}; } catch { return {}; }
    })();

    const queryTokens = tokenize(String(search || ''));
    const queryTf = buildTf(queryTokens);

    function prefBoost(job: any): number {
      let boost = 1;
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
        if (hit) boost *= 1.2;
      }

      if (Array.isArray(preferences.preferredLocations) && preferences.preferredLocations.length) {
        const hit = preferences.preferredLocations.some((l: string) => loc.includes(String(l).toLowerCase()));
        if (hit) boost *= 1.15;
      }

      if (preferences.remoteWork) {
        if (loc.includes('remote')) boost *= 1.1;
      }

      if (Array.isArray(preferences.requiredSkills) && preferences.requiredSkills.length) {
        const hit = preferences.requiredSkills.some((s: string) => title.includes(String(s).toLowerCase()));
        if (hit) boost *= 1.15;
      }

      if (Array.isArray(preferences.excludeKeywords) && preferences.excludeKeywords.length) {
        const bad = preferences.excludeKeywords.some((k: string) => title.includes(String(k).toLowerCase()));
        if (bad) boost *= 0.7;
      }

      return boost;
    }

    // Precompute document vectors using TF only (IDF is approximated by token rarity across candidates)
    const docTfs: Map<string, number>[] = [];
    const df = new Map<string, number>();
    for (const job of candidates) {
      const text = `${job.title || ''} ${job.company || ''} ${job.location || ''}`;
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
      const score = base * 0.7 + recency * 0.1;
      const boosted = score * prefBoost(job);
      return { job, score: boosted };
    })
    .sort((a, b) => b.score - a.score);

    const totalJobs = scored.length;
    const totalPages = Math.ceil(totalJobs / limitNum);
    const pageItems = scored.slice(skip, skip + limitNum).map(({ job }) => ({
      id: job._id,
      title: job.title,
      company: job.company,
      location: job.location,
      jobUrl: job.jobUrl,
      salary: job.salary,
      source: job.source,
      scrapedAt: job.scrapedAt
    }));

    // Basic stats by source
    const stats = scored.reduce((acc: Record<string, number>, { job }) => {
      acc[job.source] = (acc[job.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return res.status(200).json({
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
    return res.status(500).json({ error: 'Failed to search jobs' });
  }
}
