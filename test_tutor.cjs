import http from 'http';
import fs from 'fs';
import path from 'path';

// Read env file to get token
const envPath = path.resolve(process.cwd(), 'backend/.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const tokenMatch = envContent.match(/TOKEN=(.*)/);
const token = tokenMatch ? tokenMatch[1] : '';

const req = http.request(
  {
    hostname: 'localhost',
    port: 5000,
    path: '/api/tutor/message',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  },
  (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => console.log('RESPONSE:', res.statusCode, data));
  }
);

req.on('error', (e) => console.error(e));
req.write(JSON.stringify({ message: "Hello", history: [] }));
req.end();
