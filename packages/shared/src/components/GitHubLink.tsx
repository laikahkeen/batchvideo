/**
 * GitHubLink Component
 *
 * Simple link button to the GitHub repository.
 */

import { Github } from 'lucide-react';
import { Button } from '@workspace/shared/components/ui/button';
import { GITHUB_REPO_URL } from '@workspace/shared/constants/urls';

export default function GitHubLink() {
  return (
    <Button variant="outline" size="icon" asChild>
      <a
        href={GITHUB_REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="View on GitHub"
        title="View source code on GitHub"
      >
        <Github className="h-[1.2rem] w-[1.2rem]" />
      </a>
    </Button>
  );
}
