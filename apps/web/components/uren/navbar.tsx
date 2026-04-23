'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Clock, LayoutDashboard, FolderKanban, FileText, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();
  
  const isActive = (path: string) => pathname === path;
  
  return (
    <nav aria-label="Urenregistratie navigatie" className="border-b bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center">
              <Clock className="h-6 w-6 text-blue-600" aria-hidden="true" />
              <span className="ml-2 text-xl font-bold text-foreground">UrenTracker</span>
            </Link>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
              <Link
                href="/dashboard"
                aria-current={isActive('/dashboard') ? 'page' : undefined}
                className={cn(
                  'inline-flex items-center px-3 py-2 text-sm font-medium rounded-md',
                  isActive('/dashboard')
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'text-foreground hover:bg-muted'
                )}
              >
                <LayoutDashboard className="h-4 w-4 mr-2" aria-hidden="true" />
                Dashboard
              </Link>
              <Link
                href="/track"
                aria-current={isActive('/track') ? 'page' : undefined}
                className={cn(
                  'inline-flex items-center px-3 py-2 text-sm font-medium rounded-md',
                  isActive('/track')
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'text-foreground hover:bg-muted'
                )}
              >
                <Clock className="h-4 w-4 mr-2" aria-hidden="true" />
                Timer
              </Link>
              <Link
                href="/projects"
                aria-current={isActive('/projects') ? 'page' : undefined}
                className={cn(
                  'inline-flex items-center px-3 py-2 text-sm font-medium rounded-md',
                  isActive('/projects')
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'text-foreground hover:bg-muted'
                )}
              >
                <FolderKanban className="h-4 w-4 mr-2" aria-hidden="true" />
                Projecten
              </Link>
              <Link
                href="/timesheets"
                aria-current={isActive('/timesheets') ? 'page' : undefined}
                className={cn(
                  'inline-flex items-center px-3 py-2 text-sm font-medium rounded-md',
                  isActive('/timesheets')
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'text-foreground hover:bg-muted'
                )}
              >
                <FileText className="h-4 w-4 mr-2" aria-hidden="true" />
                Urenstaten
              </Link>
              <Link
                href="/settings"
                aria-current={isActive('/settings') ? 'page' : undefined}
                className={cn(
                  'inline-flex items-center px-3 py-2 text-sm font-medium rounded-md',
                  isActive('/settings')
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'text-foreground hover:bg-muted'
                )}
              >
                <Settings className="h-4 w-4 mr-2" aria-hidden="true" />
                Instellingen
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <div className="hidden sm:block text-sm text-muted-foreground">
              <span className="font-medium">Timer:</span>
              <span className="ml-2 font-mono text-green-600">00:00:00</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
