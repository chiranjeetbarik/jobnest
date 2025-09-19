import type { IncomingMessage, ServerResponse } from 'http';
import cookie from 'cookie';

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
) {
  if (request.method !== 'POST') {
    response.writeHead(405, { 'Content-Type': 'application/json' });
    return response.end(JSON.stringify({ message: 'Method Not Allowed' }));
  }

  response.setHeader('Set-Cookie', cookie.serialize('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    expires: new Date(0),
    sameSite: 'strict',
    path: '/',
  }));

  response.writeHead(200, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify({ message: 'Logged out successfully!' }));
}
