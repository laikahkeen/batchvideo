/**
 * Header Component (Web-only)
 *
 * Mobile-first header with adaptive layout:
 * - Mobile: Compact logo, centered tabs, dropdown menu for controls
 * - Desktop: Full logo with brand, tabs, and visible icon controls
 */

import { Video, MoreVertical, MessageSquare, Github, Moon, Sun, Download } from 'lucide-react';

import { Button } from '@workspace/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/shared/components/ui/dropdown-menu';
import { useTheme } from '@workspace/shared/components/theme-provider';
import { usePlatform } from '@workspace/shared/platform';
import { useOS, getOSDisplayName, getDownloadURL } from '@workspace/shared/hooks/useOS';
import { GITHUB_REPO_URL, GITHUB_ISSUES_NEW_URL } from '@workspace/shared/constants/urls';

import DownloadButton from '@workspace/shared/components/DownloadButton';
import FeedbackLink from '@workspace/shared/components/FeedbackLink';
import GitHubLink from '@workspace/shared/components/GitHubLink';
import ThemeToggle from '@workspace/shared/components/ThemeToggle';

export type TabType = 'home' | 'app';

interface HeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isProcessing?: boolean;
}

export default function Header({ activeTab, onTabChange, isProcessing = false }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { adapter } = usePlatform();
  const os = useOS();
  const downloadURL = getDownloadURL(os);

  const toggleTheme = () => {
    const currentTheme =
      theme === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : theme;
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  };

  const handleFeedbackClick = () => {
    adapter.analytics.trackFeedbackClicked();
  };

  return (
    <header className="shrink-0 border-b border-gray-200/60 bg-white/70 backdrop-blur-md dark:border-gray-800/60 dark:bg-gray-900/70">
      <div className="mx-auto max-w-7xl px-3 py-2.5 sm:px-6 sm:py-3">
        {/* CSS Grid: 3-column layout - logo | tabs | controls */}
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-4">
          {/* Logo - Icon only on mobile, full branding on desktop */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 shadow-md shadow-blue-500/20 sm:h-10 sm:w-10">
              <Video className="h-5 w-5 text-white sm:h-6 sm:w-6" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                batchvideo
              </h1>
              <p className="text-[11px] font-medium tracking-wide text-gray-500 dark:text-gray-400">
                Batch Video Processor
              </p>
            </div>
          </div>

          {/* Navigation tabs - centered in middle column */}
          <nav className="flex justify-center">
            <div className="flex items-center gap-0.5 rounded-full bg-gray-100/80 p-1 dark:bg-gray-800/80">
              <button
                onClick={() => onTabChange('home')}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200 sm:px-4 ${
                  activeTab === 'home'
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => onTabChange('app')}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200 sm:px-4 ${
                  activeTab === 'app'
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                App
              </button>
            </div>
          </nav>

          {/* Right-side controls */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {/* Processing indicator - desktop only */}
            {isProcessing && (
              <span className="mr-2 hidden items-center gap-2 text-sm font-medium text-blue-500 sm:flex dark:text-blue-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500 dark:bg-blue-400"></span>
                Processing...
              </span>
            )}

            {/* Desktop: Show all buttons */}
            <div className="hidden items-center gap-1.5 sm:flex">
              <DownloadButton variant="icon" />
              <FeedbackLink />
              <GitHubLink />
              <ThemeToggle />
            </div>

            {/* Mobile: Dropdown menu */}
            <div className="sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-9 w-9 rounded-full"
                    aria-label="Open menu"
                  >
                    {isProcessing && (
                      <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-blue-500 dark:border-gray-900"></span>
                    )}
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {/* Processing indicator in dropdown */}
                  {isProcessing && (
                    <>
                      <div className="flex items-center gap-3 px-3 py-2">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500"></span>
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          Processing videos...
                        </span>
                      </div>
                      <DropdownMenuSeparator />
                    </>
                  )}

                  {/* Download */}
                  <DropdownMenuItem asChild>
                    <a
                      href={downloadURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex cursor-pointer items-center gap-3"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download for {getOSDisplayName(os)}</span>
                    </a>
                  </DropdownMenuItem>

                  {/* Feedback */}
                  <DropdownMenuItem asChild>
                    <a
                      href={GITHUB_ISSUES_NEW_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={handleFeedbackClick}
                      className="flex cursor-pointer items-center gap-3"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Send Feedback</span>
                    </a>
                  </DropdownMenuItem>

                  {/* GitHub */}
                  <DropdownMenuItem asChild>
                    <a
                      href={GITHUB_REPO_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex cursor-pointer items-center gap-3"
                    >
                      <Github className="h-4 w-4" />
                      <span>View on GitHub</span>
                    </a>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {/* Theme toggle */}
                  <DropdownMenuItem onClick={toggleTheme} className="flex cursor-pointer items-center gap-3">
                    <div className="relative h-4 w-4">
                      <Sun className="absolute h-4 w-4 scale-100 rotate-0 transition-transform dark:scale-0 dark:-rotate-90" />
                      <Moon className="absolute h-4 w-4 scale-0 rotate-90 transition-transform dark:scale-100 dark:rotate-0" />
                    </div>
                    <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
