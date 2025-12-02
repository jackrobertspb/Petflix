// Vercel serverless function entry point for Express.js backend
// This file is used by Vercel to handle all API routes
// IMPORTANT: Make sure Root Directory is set to "backend" in Vercel project settings

// Build TypeScript if dist folder doesn't exist (for Vercel deployments)
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distPath = join(__dirname, '../dist/server.js');

if (!existsSync(distPath)) {
  console.log('📦 Building TypeScript...');
  try {
    execSync('npm run build', { cwd: join(__dirname, '..'), stdio: 'inherit' });
    console.log('✅ Build completed');
  } catch (error) {
    console.error('❌ Build failed:', error);
    throw error;
  }
}

import app from '../dist/server.js';

// Export the Express app as a serverless function handler
export default app;

