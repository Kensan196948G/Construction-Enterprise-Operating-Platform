import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  transpilePackages: ['@civil-ims/types'],
  // Pin the workspace root so Next.js does not pick up parent-dir lockfiles
  outputFileTracingRoot: path.join(__dirname, '../../'),
  // Standalone output for optimized Docker production images
  output: 'standalone',
};

export default nextConfig;
