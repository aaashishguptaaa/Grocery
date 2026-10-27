import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  devIndicators: false,
  images:{
   remotePatterns:[
     {hostname:"lh3.googleusercontent.com"},
     {hostname:"plus.unsplash.com"},
     {hostname:"images.unsplash.com"},
     {hostname:"res.cloudinary.com"}
   ]
  }
};

export default nextConfig;
