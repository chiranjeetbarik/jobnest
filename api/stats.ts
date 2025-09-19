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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
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

    // Get total job count
    const totalJobs = await collection.countDocuments();

    // Get jobs by source
    const jobsBySource = await collection.aggregate([
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    // Get recent jobs (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const recentJobs = await collection.countDocuments({
      scrapedAt: { $gte: yesterday }
    });

    // Get top companies
    const topCompanies = await collection.aggregate([
      {
        $group: {
          _id: '$company',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray();

    // Get top locations
    const topLocations = await collection.aggregate([
      {
        $group: {
          _id: '$location',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray();

    // Get jobs with salary information
    const jobsWithSalary = await collection.countDocuments({
      salary: { $exists: true, $nin: [null, ''] }
    });

    res.status(200).json({
      totalJobs,
      recentJobs,
      jobsWithSalary,
      salaryPercentage: totalJobs > 0 ? Math.round((jobsWithSalary / totalJobs) * 100) : 0,
      sources: jobsBySource.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {} as Record<string, number>),
      topCompanies: topCompanies.map(item => ({
        name: item._id,
        count: item.count
      })),
      topLocations: topLocations.map(item => ({
        name: item._id,
        count: item.count
      }))
    });

  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
