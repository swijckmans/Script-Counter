import { ReactNode } from "react";
import Link from "next/link";
import { HomeIcon, ChartBarIcon, ClockIcon } from "@heroicons/react/24/outline";

interface MainLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: "Home", href: "/", icon: HomeIcon },
  { name: "Analysis", href: "/analysis", icon: ChartBarIcon },
  { name: "History", href: "/history", icon: ClockIcon },
];

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <span className="text-xl font-bold text-indigo-600">
                  Script Counter
                </span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  >
                    <item.icon className="mr-2 h-5 w-5" />
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
