import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type LegalDoc = {
  slug: string;
  title: string;
  content: string;
  updated_at: string;
};

export const LEGAL_SLUGS = [
  "privacy-policy",
  "terms-of-service",
  "how-it-works",
  "working-hours",
  "company-info",
] as const;
export type LegalSlug = (typeof LEGAL_SLUGS)[number];

export const LEGAL_META: Record<LegalSlug, { emoji: string; blurb: string }> = {
  "privacy-policy":   { emoji: "🔒", blurb: "How we collect, use, and protect your data" },
  "terms-of-service": { emoji: "📄", blurb: "The rules that apply to your FastCredit account" },
  "how-it-works":     { emoji: "⚙️", blurb: "Step-by-step guide to using FastCredit" },
  "working-hours":    { emoji: "🕐", blurb: "Support availability and response times" },
  "company-info":     { emoji: "🏢", blurb: "About FastCredit and our mission" },
};

// Use `as never` cast because generated types haven't been regenerated yet.
const table = () => supabase.from("legal_documents" as never);

export function useLegalDocs() {
  const [docs, setDocs] = useState<LegalDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data } = await table().select("*").order("slug");
      if (cancelled) return;
      setDocs(((data ?? []) as unknown) as LegalDoc[]);
      setLoading(false);
    }
    load();
    const channel = supabase
      .channel("legal-docs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "legal_documents" },
        load,
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  return { docs, loading };
}

export function useLegalDoc(slug: string) {
  const [doc, setDoc] = useState<LegalDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data } = await table().select("*").eq("slug", slug).maybeSingle();
      if (cancelled) return;
      setDoc((data as unknown) as LegalDoc | null);
      setLoading(false);
    }
    load();
    const channel = supabase
      .channel(`legal-doc-${slug}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "legal_documents", filter: `slug=eq.${slug}` },
        load,
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [slug]);

  return { doc, loading };
}

export async function saveLegalDoc(slug: string, title: string, content: string) {
  // Upsert so a missing slug is created automatically.
  const { error } = await table().upsert(
    { slug, title, content, updated_at: new Date().toISOString() } as never,
    { onConflict: "slug" },
  );
  if (error) throw error;
}
