import type { IncomingMessage, ServerResponse } from 'http';
import { connectToDatabase } from '../src/lib/db.ts';
import bcrypt from 'bcrypt';

async function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(e);
      }
    });
  });
}

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
) {
  if (request.method !== 'POST') {
    response.writeHead(405, { 'Content-Type': 'application/json' });
    return response.end(JSON.stringify({ message: 'Method Not Allowed' }));
  }

  try {
    const { email, password } = await parseBody(request);

    if (!email || !password || password.length < 6) {
      response.writeHead(400, { 'Content-Type': 'application/json' });
      return response.end(JSON.stringify({ message: 'Invalid input - password should be at least 6 characters long.' }));
    }

    const client = await connectToDatabase();
    const db = client.db();
    const usersCollection = db.collection('users');

    const existingUser = await usersCollection.findOne({ email });

    if (existingUser) {
      response.writeHead(422, { 'Content-Type': 'application/json' });
      return response.end(JSON.stringify({ message: 'User already exists.' }));
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await usersCollection.insertOne({
      email,
      password: hashedPassword,
    });

    response.writeHead(201, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ message: 'User created successfully!' }));

  } catch (error) {
    console.error(error);
    response.writeHead(500, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ message: 'Internal Server Error' }));
  }
}
