import type { IncomingMessage, ServerResponse } from 'http';
import { connectToDatabase } from '../src/lib/db.ts';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

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

    if (!email || !password) {
      response.writeHead(400, { 'Content-Type': 'application/json' });
      return response.end(JSON.stringify({ message: 'Invalid input.' }));
    }

    const client = await connectToDatabase();
    const db = client.db();
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ email });

    if (!user) {
      response.writeHead(401, { 'Content-Type': 'application/json' });
      return response.end(JSON.stringify({ message: 'Invalid credentials.' }));
    }

    const passwordsMatch = await bcrypt.compare(password, user.password);

    if (!passwordsMatch) {
      response.writeHead(401, { 'Content-Type': 'application/json' });
      return response.end(JSON.stringify({ message: 'Invalid credentials.' }));
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '1h' },
    );

    response.setHeader('Set-Cookie', cookie.serialize('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      maxAge: 3600,
      sameSite: 'strict',
      path: '/',
    }));

    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ message: 'Logged in successfully!' }));

  } catch (error) {
    console.error(error);
    response.writeHead(500, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ message: 'Internal Server Error' }));
  }
}
