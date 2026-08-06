const rawMountPath = process.env.WEBFLOW_CLOUD_MOUNT_PATH || "";
const mountPath = rawMountPath && rawMountPath !== "/"
  ? `/${rawMountPath.replace(/^\/+|\/+$/g, "")}`
  : "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  basePath: mountPath,
  assetPrefix: mountPath || undefined,
  images: {
    unoptimized: true
  }
};

export default nextConfig;
