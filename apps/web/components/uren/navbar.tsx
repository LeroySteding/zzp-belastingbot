'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Clock, LayoutDashboard, FolderKanban, FileText, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();
  
  const isActive = (path: string) => pathname === path;
  
  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center">
              <Clock className="h-6 w-6 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">UrenTracker</span>
            </Link>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
              <Link
                href="/dashboard"
                className={cn(
                  'inline-flex items-center px-3 py-2 text-sm font-medium rounded-md',
                  isActive('/dashboard')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
              <Link
                href="/track"
                className={cn(
                  'inline-flex items-center px-3 py-2 text-sm font-medium rounded-md',
                  isActive('/track')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Clock className="h-4 w-4 mr-2" />
                Timer
              </Link>
              <Link
                href="/projects"
                className={cn(
                  'inline-flex items-center px-3 py-2 text-sm font-medium rounded-md',
                  isActive('/projects')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <FolderKanban className="h-4 w-4 mr-2" />
                Projecten
              </Link>
              <Link
                href="/timesheets"
                className={cn(
                  'inline-flex items-center px-3 py-2 text-sm font-medium rounded-md',
                  isActive('/timesheets')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <FileText className="h-4 w-4 mr-2" />
                Urenstaten
              </Link>
              <Link
                href="/settings"
                className={cn(
                  'inline-flex items-center px-3 py-2 text-sm font-medium rounded-md',
                  isActive('/settings')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Settings className="h-4 w-4 mr-2" />
                Instellingen
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <div className="hidden sm:block text-sm text-gray-600">
              <span className="font-medium">Timer:</span>
              <span className="ml-2 font-mono text-green-600">00:00:00</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
