'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

interface NavigationContextType {
  isNavigating: boolean;
  startNavigation: (message?: string) => void;
  stopNavigation: () => void;
}

const NavigationContext = createContext<NavigationContextType>({
  isNavigating: false,
  startNavigation: () => {},
  stopNavigation: () => {},
});

export const useNavigation = () => useContext(NavigationContext);

function NavigationWatcher({
  onRouteComplete,
}: {
  onRouteComplete: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    onRouteComplete();
  }, [pathname, searchParams, onRouteComplete]);

  return null;
}

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [isNavigating, setIsNavigating] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const [progress, setProgress] = useState(0);

  const startNavigation = useCallback(() => {
    setIsNavigating(true);
    setProgress((p) => (p > 0 ? p : 25));
  }, []);

  const stopNavigation = useCallback(() => {
    setProgress(100);
    setShowSpinner(false);
    const timeout = setTimeout(() => {
      setIsNavigating(false);
      setProgress(0);
    }, 200);
    return () => clearTimeout(timeout);
  }, []);

  // Show small center spinner if navigation takes more than 100ms
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isNavigating) {
      timer = setTimeout(() => setShowSpinner(true), 100);
    } else {
      setShowSpinner(false);
    }
    return () => clearTimeout(timer);
  }, [isNavigating]);

  // Intercept all internal navigation link clicks and beforeunload
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement)?.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      if (
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        anchor.target === '_blank' ||
        anchor.hasAttribute('download') ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey
      ) {
        return;
      }

      try {
        const targetUrl = new URL(href, window.location.href);
        if (targetUrl.origin === window.location.origin) {
          if (
            targetUrl.pathname === window.location.pathname &&
            targetUrl.search === window.location.search
          ) {
            return;
          }
          startNavigation();
        }
      } catch {}
    };

    const handleBeforeUnload = () => {
      startNavigation();
    };

    document.addEventListener('click', handleAnchorClick, { capture: true });
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('click', handleAnchorClick, { capture: true });
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [startNavigation]);

  // Smoothly increment progress bar while navigating
  useEffect(() => {
    if (!isNavigating) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.floor(Math.random() * 8) + 4;
      });
    }, 120);
    return () => clearInterval(interval);
  }, [isNavigating]);

  return (
    <NavigationContext.Provider value={{ isNavigating, startNavigation, stopNavigation }}>
      <Suspense fallback={null}>
        <NavigationWatcher onRouteComplete={stopNavigation} />
      </Suspense>

      {/* Top slim animated progress bar */}
      {(isNavigating || progress > 0) && (
        <div className="fixed top-0 left-0 right-0 z-[9999] h-[2.5px] bg-transparent pointer-events-none">
          <div
            className="h-full bg-gradient-to-r from-[#3760F8] via-[#6186FF] to-[#3760F8] transition-all duration-150 ease-out shadow-[0_0_8px_rgba(55,96,248,0.7)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Small clean floating circular spinner matching Image 2 */}
      {showSpinner && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-white/30 backdrop-blur-[1px] transition-opacity duration-150 pointer-events-none"
        >
          <div className="relative flex items-center justify-center p-3">
            {/* Soft subtle radial blue glow */}
            <div className="absolute w-12 h-12 rounded-full bg-blue-500/10 blur-sm pointer-events-none" />
            {/* Clean small circular arc loader */}
            <svg
              className="w-9 h-9 animate-spin"
              viewBox="0 0 36 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="18"
                cy="18"
                r="14"
                stroke="#3760F8"
                strokeWidth="2.5"
                strokeOpacity="0.12"
              />
              <path
                d="M 18 4 A 14 14 0 0 1 32 18"
                stroke="#3760F8"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      )}

      {children}
    </NavigationContext.Provider>
  );
}
