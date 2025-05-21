"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function Home() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      router.push(`/analysis/${data.id}`);
    } catch (error) {
      console.error("Error analyzing URL:", error);
      setError(
        error instanceof Error ? error.message : "Failed to analyze website"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Website Script Analysis
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          Analyze any website to discover its first-party and third-party
          scripts. Perfect for sales professionals looking to understand their
          prospects' tech stack.
        </p>
        <form onSubmit={handleSubmit} className="mt-10">
          <div className="flex flex-col gap-4">
            <div className="flex gap-x-4">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter website URL (e.g., https://example.com)"
                className="min-w-0 flex-auto rounded-md border-0 bg-white/5 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                required
              />
              <button
                type="submit"
                disabled={isLoading}
                className="flex-none rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
              >
                {isLoading ? "Analyzing..." : "Analyze"}
              </button>
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}
            {isLoading && (
              <div className="flex justify-center">
                <LoadingSpinner size="sm" text="Analyzing website..." />
              </div>
            )}
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
