import type { NextConfig } from "next";

const noIndex = [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }];

const nextConfig: NextConfig = {
  // Teacher profiles and the teacher directory must never appear in
  // search. The pages also set robots metadata; this header covers
  // every response (including ones without HTML metadata) as a second layer.
  // Send the bare domain to the canonical www host.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "classhire.com.ng" }],
        destination: "https://www.classhire.com.ng/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      { source: "/profile/:path*", headers: noIndex },
      { source: "/talent", headers: noIndex },
      { source: "/talent/:path*", headers: noIndex },
    ];
  },
};

export default nextConfig;
