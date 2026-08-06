import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const rawMountPath = process.env.BASE_URL || process.env.WEBFLOW_CLOUD_MOUNT_PATH || "";
const mountPath = rawMountPath && rawMountPath !== "/"
  ? `/${rawMountPath.replace(/^\/+|\/+$/g, "")}`
  : "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  basePath: mountPath,
  assetPrefix: mountPath || undefined,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: mountPath }
};

export default nextConfig;

initOpenNextCloudflareForDev();
