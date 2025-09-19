import { MongoClient } from 'mongodb';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

let cachedClient: MongoClient | null = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }

  const client = await MongoClient.connect(MONGODB_URI!);
  cachedClient = client;
  return client;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db('jobnest');
    const collection = db.collection('raw_jobs');

    const { 
      page = '1', 
      limit = '20', 
      search = '', 
      location = '', 
      source = '',
      category = ''
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build search query
    const query: any = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    if (source) {
      query.source = source;
    }

    // Get jobs with pagination
    const jobs = await collection
      .find(query)
      .sort({ scrapedAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .toArray();

    // Get total count for pagination
    const totalJobs = await collection.countDocuments(query);

    // Get job statistics
    const stats = await collection.aggregate([
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    const totalPages = Math.ceil(totalJobs / limitNum);

    res.status(200).json({
      jobs: jobs.map(job => ({
        id: job._id,
        title: job.title,
        company: job.company,
        location: job.location,
        jobUrl: job.jobUrl,
        salary: job.salary,
        source: job.source,
        scrapedAt: job.scrapedAt
      })),
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalJobs,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      },
      stats: stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {} as Record<string, number>)
    });

  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch jobs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
