/**
 * DownloadButton Component
 *
 * OS-aware download button that detects the user's operating system
 * and provides appropriate download links to GitHub releases.
 *
 * Supports two variants:
 * - 'icon': Compact icon-only button for header
 * - 'full': Full button with text for hero/CTA sections
 */

import { Download } from 'lucide-react';
import { Button } from '@workspace/shared/components/ui/button';
import { useOS, getOSDisplayName, getDownloadURL, type OS } from '@workspace/shared/hooks/useOS';

interface DownloadButtonProps {
  variant?: 'icon' | 'full';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  onClick?: () => void;
}

/**
 * Get the download icon
 */
function getDownloadIcon() {
  return <Download className="h-[1.2rem] w-[1.2rem]" />;
}

/**
 * Get button text based on OS availability
 * Currently only macOS builds are available
 */
function getButtonText(os: OS): string {
  const displayName = getOSDisplayName(os);

  switch (os) {
    case 'macos':
      return `Download for ${displayName}`;
    case 'windows':
      return 'Download for Windows (Coming Soon)';
    case 'linux':
      return 'Download for Linux (Coming Soon)';
    default:
      return 'Download Desktop App';
  }
}

/**
 * Check if download is available for OS
 */
function isDownloadAvailable(os: OS): boolean {
  return os === 'macos'; // Only macOS available for now
}

export default function DownloadButton({
  variant = 'icon',
  size = 'default',
  className = '',
  onClick,
}: DownloadButtonProps) {
  const os = useOS();
  const downloadURL = getDownloadURL(os);
  const available = isDownloadAvailable(os);

  const handleClick = () => {
    onClick?.();
  };

  // Icon variant - compact button for header
  if (variant === 'icon') {
    return (
      <Button variant="outline" size="icon" className={className} asChild>
        <a
          href={downloadURL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Download desktop app"
          title={`Download desktop app for ${getOSDisplayName(os)}`}
          onClick={handleClick}
        >
          {getDownloadIcon()}
        </a>
      </Button>
    );
  }

  // Full variant - button with text for hero/CTA
  // When unavailable, render a disabled button (not a link)
  if (!available) {
    return (
      <Button variant="secondary" size={size} className={className} disabled>
        {getDownloadIcon()}
        <span className="ml-2">{getButtonText(os)}</span>
      </Button>
    );
  }

  return (
    <Button variant="default" size={size} className={className} asChild>
      <a
        href={downloadURL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Download desktop app"
        onClick={handleClick}
      >
        {getDownloadIcon()}
        <span className="ml-2">{getButtonText(os)}</span>
        <span className="ml-1 text-xs opacity-70">(~200MB)</span>
      </a>
    </Button>
  );
}
