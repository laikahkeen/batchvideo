import { Github } from 'lucide-react';
import { Button } from '@workspace/ui/components/ui/button';

export default function GitHubLink() {
  return (
    <Button variant="outline" size="icon" asChild>
      <a
        href="https://github.com/laikahkeen/batchvideo"
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
