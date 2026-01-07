/**
 * HeroContent Component (Web-only)
 *
 * Marketing landing content shown in the Home tab.
 * Full-viewport height layout with header, centered hero content, and footer.
 * Features refined typography, subtle animations, and editorial aesthetics.
 */

import { ArrowRight, Shield, Zap, Camera, Video } from 'lucide-react';
import { Button } from '@workspace/shared/components/ui/button';
import DownloadButton from '@workspace/shared/components/DownloadButton';
import { trackHeroDismissed } from '../utils/analytics';

interface HeroContentProps {
  onGetStarted: () => void;
}

export default function HeroContent({ onGetStarted }: HeroContentProps) {
  const handleGetStarted = () => {
    trackHeroDismissed();
    onGetStarted();
  };

  return (
    <div className="relative flex flex-1 flex-col overflow-y-auto">
      {/* Full-bleed background decoration - covers entire component including footer */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[20%] -right-[10%] h-[60vh] max-h-[600px] min-h-[300px] w-[60vw] max-w-[600px] min-w-[300px] rounded-full bg-blue-500/5 blur-3xl dark:bg-blue-400/10" />
        <div className="absolute -bottom-[10%] -left-[10%] h-[60vh] max-h-[600px] min-h-[300px] w-[60vw] max-w-[600px] min-w-[300px] rounded-full bg-purple-500/5 blur-3xl dark:bg-purple-400/10" />
      </div>

      {/* Main Hero Area - Centered Content */}
      <main className="relative z-10 flex flex-1 justify-center overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex w-full max-w-4xl flex-col items-center text-center">
          {/* Badge - with entrance animation */}
          <div className="animate-fade-in-up mb-8 inline-flex items-center gap-2.5 rounded-full border border-blue-200/60 bg-blue-50/80 px-5 py-2 text-sm font-medium text-blue-700 backdrop-blur-sm dark:border-blue-700/40 dark:bg-blue-900/40 dark:text-blue-300">
            <Camera className="h-4 w-4" />
            <span>Optimized for GoPro, Insta360 & DJI</span>
          </div>

          {/* Headline - with staggered animation */}
          <h2 className="animate-fade-in-up-delay-1 mb-6 max-w-3xl text-4xl leading-[1.1] font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl dark:text-white">
            Batch process your{' '}
            <span className="bg-linear-to-r from-blue-600 via-blue-500 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-blue-300 dark:to-purple-400">
              action camera
            </span>{' '}
            footage
          </h2>

          {/* Subheadline */}
          <p className="animate-fade-in-up-delay-2 mx-auto mb-10 max-w-2xl leading-relaxed text-gray-600 dark:text-gray-300">
            Apply LUTs, compress, and convert 360° videos — all without uploading to the cloud. Your videos stay on your
            device.
          </p>

          {/* CTAs */}
          <div className="animate-fade-in-up-delay-3 mb-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="group gap-2.5 px-8 shadow-lg shadow-blue-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30"
            >
              Try in Browser
              <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Button>
            <DownloadButton variant="full" size="lg" />
          </div>

          {/* Feature Pills */}
          <div className="animate-fade-in-up-delay-4 mb-6 flex flex-wrap items-center justify-center gap-3">
            <div className="flex items-center gap-2.5 rounded-full border border-gray-200/60 bg-white/60 px-4 py-2 text-sm font-medium text-gray-700 backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800/60 dark:text-gray-300">
              <span className="h-2 w-2 rounded-full bg-green-500 shadow-sm shadow-green-500/50" />
              LUT Application
            </div>
            <div className="flex items-center gap-2.5 rounded-full border border-gray-200/60 bg-white/60 px-4 py-2 text-sm font-medium text-gray-700 backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800/60 dark:text-gray-300">
              <span className="h-2 w-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
              Video Compression
            </div>
            <div className="flex items-center gap-2.5 rounded-full border border-gray-200/60 bg-white/60 px-4 py-2 text-sm font-medium text-gray-700 backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800/60 dark:text-gray-300">
              <span className="h-2 w-2 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50" />
              360° Conversion
            </div>
          </div>

          {/* Trust Signals Card */}
          <div className="pb-6">
            <div className="animate-fade-in-up-delay-5 mx-auto max-w-2xl rounded-2xl border border-gray-200/60 bg-white/70 shadow-xl shadow-gray-900/5 backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-900/70 dark:shadow-none">
              <div className="grid divide-y divide-gray-200/60 sm:grid-cols-3 sm:divide-x sm:divide-y-0 dark:divide-gray-700/60">
                <div className="flex flex-col items-center gap-3 p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100/80 dark:bg-green-900/40">
                    <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">100% Private</h3>
                  <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                    Your videos never leave your device
                  </p>
                </div>
                <div className="flex flex-col items-center gap-3 p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100/80 dark:bg-blue-900/40">
                    <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">No Account Needed</h3>
                  <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                    Start processing immediately
                  </p>
                </div>
                <div className="flex flex-col items-center gap-3 p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100/80 dark:bg-purple-900/40">
                    <Video className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Batch Processing</h3>
                  <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                    Process multiple videos at once
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer - Pinned at bottom with proper z-index */}
      <footer className="relative z-10 shrink-0 border-t border-gray-200/60 bg-white/50 py-4 backdrop-blur-sm dark:border-gray-800/60 dark:bg-gray-900/50">
        <p className="text-center text-sm text-gray-500 dark:text-gray-500">
          Powered by FFmpeg • Works best in Chrome/Edge
        </p>
      </footer>

    </div>
  );
}
