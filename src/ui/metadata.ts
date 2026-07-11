import type { Metadata } from "next";

export function routeMetadata(title: string, description: string, canonical: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical }
  };
}
