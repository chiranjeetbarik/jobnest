import type { IncomingMessage, ServerResponse } from 'http';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import { connectToDatabase } from '../src/lib/db.ts';
import { ObjectId } from 'mongodb';

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
) {
  if (request.method !== 'GET') {
    response.writeHead(405, { 'Content-Type': 'application/json' });
    return response.end(JSON.stringify({ message: 'Method Not Allowed' }));
  }

  try {
    const cookies = cookie.parse(request.headers.cookie || '');
    const token = cookies.token;

    if (!token) {
      response.writeHead(401, { 'Content-Type': 'application/json' });
      return response.end(JSON.stringify({ message: 'Not authenticated.' }));
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { userId: string, email: string };
    } catch (error) {
      response.writeHead(401, { 'Content-Type': 'application/json' });
      return response.end(JSON.stringify({ message: 'Not authenticated.' }));
    }

    const client = await connectToDatabase();
    const db = client.db();
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ _id: new ObjectId(decodedToken.userId) });

    if (!user) {
        response.writeHead(401, { 'Content-Type': 'application/json' });
        return response.end(JSON.stringify({ message: 'User not found.' }));
    }

    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ email: user.email }));

  } catch (error) {
    console.error(error);
    response.writeHead(500, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ message: 'Internal Server Error' }));
  }
}
