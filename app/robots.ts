import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/site"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/admin/",
          "/api/",
          "/login",
          "/register",
          "/reset-password",
          "/forgot-password",
          // Private, per-user pages — nothing here should ever be indexed.
          "/apply/",
          "/quiz/",
          "/profile/teacher/me",
          "/schools/me",
          "/account-disabled",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
