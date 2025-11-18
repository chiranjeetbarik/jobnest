import { MongoClient } from 'mongodb';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const MONGODB_URI = process.env.MONGODB_URI;

let cachedClient: MongoClient | null = null;
async function connectToDatabase() {
  if (cachedClient) return cachedClient;
  if (!MONGODB_URI) throw new Error('MONGODB_URI not set');
  const client = await MongoClient.connect(MONGODB_URI);
  cachedClient = client;
  return client;
}

const categoryKeywords: Record<string, string[]> = {
  'software-development': ['developer','software','engineer','frontend','backend','full','stack','react','node','python','java','devops'],
  'data-science': ['data','machine','learning','ml','ai','scientist','analyst','nlp','vision'],
  'marketing': ['marketing','sales','seo','content','growth','performance'],
  'design': ['designer','design','ux','ui','graphic','product'],
  'finance': ['finance','accounting','analyst','accountant','cfo','audit'],
  'healthcare': ['healthcare','medical','nurse','doctor','physician','hospital'],
  'education': ['teacher','education','training','instructor','professor','tutor'],
  'operations': ['operations','manager','management','project','supervisor']
};

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

  if (req.method === 'OPTIONS') return send(200, {});
  if (req.method !== 'GET') return send(405, { error: 'Method not allowed' });

  try {
    if (!MONGODB_URI) {
      // No DB configured; let frontend fallback compute counts
      return send(503, { error: 'MONGODB_URI not configured' });
    }

    const client = await connectToDatabase();
    const db = client.db('jobnest');
    const collection = db.collection('raw_jobs');

    const results: Record<string, number> = {};
    for (const [id, kws] of Object.entries(categoryKeywords)) {
      const regexes = kws.map(k => new RegExp(k, 'i'));
      const count = await collection.countDocuments({
        $or: regexes.map(r => ({ title: { $regex: r } }))
      });
      results[id] = count;
    }

    return send(200, { counts: results });
  } catch (err) {
    console.error('category-counts error', err);
    return send(500, { error: 'Failed to compute category counts' });
  }
}
