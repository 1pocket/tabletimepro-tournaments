// apps/web/next.config.mjs
import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // keep your existing settings:
  experimental: { externalDir: true }, // important for importing from ../../packages

  webpack: (config) => {
    // point @ttpro/core to our source folder (no package build required)
    config.resolve.alias['@ttpro/core'] = path.resolve(
      __dirname,
      '../../packages/core/src'
    );
    return config;
  },
};

export default nextConfig;
