import type { IncomingMessage, ServerResponse } from 'http';
import { connectToDatabase } from '../src/lib/db.ts';

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
) {
  try {
    const client = await connectToDatabase();
    await client.db('admin').command({ ping: 1 });
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ message: 'Successfully connected to MongoDB!' }));
  } catch (error) {
    console.error(error);
    response.writeHead(500, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ message: 'Error connecting to MongoDB', error }));
  }
}
