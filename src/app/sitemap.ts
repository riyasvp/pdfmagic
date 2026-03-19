import { MetadataRoute } from "next";
import { getAllToolIds } from "@/lib/tools-config";

const BASE_URL = "https://pdfmagic.store";

export default function sitemap(): MetadataRoute.Sitemap {
  const toolIds = getAllToolIds();
  
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/#pricing`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/#features`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/#tools`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  const toolPages: MetadataRoute.Sitemap = toolIds.map((toolId) => ({
    url: `${BASE_URL}/tool/${toolId}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...toolPages];
}
