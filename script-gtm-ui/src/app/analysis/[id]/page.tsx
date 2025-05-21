"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import AnalysisResults from "@/components/analysis/AnalysisResults";

interface Analysis {
  id: string;
  website: {
    url: string;
    tags: {
      name: string;
      count: number;
    }[];
  };
  firstPartyCount: number;
  thirdPartyCount: number;
  inlineCount: number;
  screenshotPath: string | null;
  createdAt: string;
}

export default function AnalysisPage() {
  const params = useParams();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const response = await fetch(`/api/analysis/${params.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch analysis");
        }
        const data = await response.json();
        setAnalysis(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [params.id]);

  return (
    <MainLayout>
      <AnalysisResults analysis={analysis} loading={loading} error={error} />
    </MainLayout>
  );
}
