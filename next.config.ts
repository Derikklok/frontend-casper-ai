import type { NextConfig } from "next"
import path from "node:path"

const nextConfig: NextConfig = {
     allowedDevOrigins: ['192.168.1.12','local-origin.dev', '*.local-origin.dev'],
     turbopack: {
    // Explicitly set the application root to this project folder
    root: path.resolve(__dirname),
  },
}

export default nextConfig
