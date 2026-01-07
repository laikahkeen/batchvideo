/**
 * FeedbackLink Component
 *
 * Link button to send feedback (opens GitHub issues).
 * Tracks analytics event via platform adapter.
 */

import { MessageSquare } from 'lucide-react';
import { Button } from '@workspace/shared/components/ui/button';
import { usePlatform } from '@workspace/shared/platform';
import { GITHUB_ISSUES_NEW_URL } from '@workspace/shared/constants/urls';

export default function FeedbackLink() {
  const { adapter } = usePlatform();

  const handleClick = () => {
    adapter.analytics.trackFeedbackClicked();
  };

  return (
    <Button variant="outline" size="icon" asChild>
      <a
        href={GITHUB_ISSUES_NEW_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Send Feedback"
        title="Send feedback or report an issue"
        onClick={handleClick}
      >
        <MessageSquare className="h-[1.2rem] w-[1.2rem]" />
      </a>
    </Button>
  );
}
