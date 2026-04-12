import path from 'node:path'
import { fileURLToPath } from 'node:url'

const isGitHubPages = process.env.GITHUB_PAGES === 'true'
const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? ''
const basePath = isGitHubPages && repositoryName ? `/${repositoryName}` : ''

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(isGitHubPages
    ? {
        output: 'export',
        trailingSlash: true,
        basePath,
        assetPrefix: basePath,
      }
    : {}),
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {
    root: path.dirname(fileURLToPath(import.meta.url)),
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
