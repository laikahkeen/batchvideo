/**
 * DownloadApp Component
 *
 * Link button to download the desktop application from GitHub Releases.
 */

import { Download } from 'lucide-react';
import { Button } from '@workspace/shared/components/ui/button';

export default function DownloadApp() {
  return (
    <Button variant="outline" size="icon" asChild>
      <a
        href="https://github.com/laikahkeen/batchvideo/releases"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Download desktop app"
        title="Download desktop app"
      >
        <Download className="h-[1.2rem] w-[1.2rem]" />
      </a>
    </Button>
  );
}
