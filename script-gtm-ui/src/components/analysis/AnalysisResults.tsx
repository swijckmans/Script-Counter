import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import LoadingSpinner from "../ui/LoadingSpinner";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

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

interface AnalysisResultsProps {
  analysis: Analysis | null;
  loading: boolean;
  error: string | null;
}

export default function AnalysisResults({
  analysis,
  loading,
  error,
}: AnalysisResultsProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading analysis results..." />
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="text-center text-red-600">
        {error || "Analysis not found"}
      </div>
    );
  }

  const chartData = {
    labels: ["First Party", "Third Party", "Inline"],
    datasets: [
      {
        label: "Script Count",
        data: [
          analysis.firstPartyCount,
          analysis.thirdPartyCount,
          analysis.inlineCount,
        ],
        backgroundColor: [
          "rgba(79, 70, 229, 0.6)",
          "rgba(99, 102, 241, 0.6)",
          "rgba(139, 92, 246, 0.6)",
        ],
        borderColor: [
          "rgb(79, 70, 229)",
          "rgb(99, 102, 241)",
          "rgb(139, 92, 246)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Script Distribution",
      },
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Analysis Results
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {new Date(analysis.createdAt).toLocaleString()}
        </p>
      </div>

      {analysis.screenshotPath && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Website Screenshot
          </h2>
          <img
            src={analysis.screenshotPath}
            alt="Website screenshot"
            className="max-w-full h-auto rounded-lg"
          />
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Script Analysis
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Website URL</h3>
            <p className="mt-1 text-sm text-gray-900">{analysis.website.url}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">
              First Party Scripts
            </h3>
            <p className="mt-1 text-sm text-gray-900">
              {analysis.firstPartyCount} scripts
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">
              Third Party Scripts
            </h3>
            <p className="mt-1 text-sm text-gray-900">
              {analysis.thirdPartyCount} scripts
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">
              Inline Scripts
            </h3>
            <p className="mt-1 text-sm text-gray-900">
              {analysis.inlineCount} scripts
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Script Distribution
        </h2>
        <div className="h-64">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>

      {analysis.website.tags && analysis.website.tags.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Script Categories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analysis.website.tags.map((tag) => (
              <div key={tag.name} className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900">
                  {tag.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {tag.count} scripts
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
