import type { NextConfig } from "next";

const noIndex = [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }];

const nextConfig: NextConfig = {
  // Teacher profiles and the teacher directory must never appear in
  // search. The pages also set robots metadata; this header covers
  // every response (including ones without HTML metadata) as a second layer.
  async headers() {
    return [
      { source: "/profile/:path*", headers: noIndex },
      { source: "/talent", headers: noIndex },
      { source: "/talent/:path*", headers: noIndex },
    ];
  },
};

export default nextConfig;
