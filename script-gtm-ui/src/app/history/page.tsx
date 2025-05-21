"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";

interface Analysis {
  id: string;
  website: {
    url: string;
  };
  firstPartyCount: number;
  thirdPartyCount: number;
  inlineCount: number;
  createdAt: string;
}

export default function HistoryPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalyses = async () => {
      try {
        const response = await fetch("/api/analyses");
        if (!response.ok) {
          throw new Error("Failed to fetch analyses");
        }
        const data = await response.json();
        setAnalyses(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyses();
  }, []);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="text-center text-red-600">{error}</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Analysis History
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            View all previous website analyses
          </p>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {analyses.map((analysis) => (
              <li key={analysis.id}>
                <Link
                  href={`/analysis/${analysis.id}`}
                  className="block hover:bg-gray-50"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-indigo-600 truncate">
                          {analysis.website.url}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          {new Date(analysis.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="ml-4 flex-shrink-0 flex">
                        <div className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {analysis.firstPartyCount +
                            analysis.thirdPartyCount +
                            analysis.inlineCount}{" "}
                          scripts
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </MainLayout>
  );
}
