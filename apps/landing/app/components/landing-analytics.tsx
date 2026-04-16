'use client';

import { useEffect } from 'react';
import {
  captureLandingEvent,
  type LandingScrollDepth,
  type LandingSectionId,
} from '../../lib/posthog-client';

const SCROLL_DEPTHS: LandingScrollDepth[] = [25, 50, 75, 100];
const SECTION_VISIBILITY_THRESHOLD = 0.35;
const SECTION_SELECTOR = '[data-landing-section]';

declare global {
  interface Window {
    __axelysLandingViewed?: boolean;
    __axelysLandingSectionsViewed?: Set<LandingSectionId>;
  }
}

function getScrollStorageKey(pathname: string) {
  return `axelys:landing:scroll-depth:${pathname}`;
}

function readReachedDepths(pathname: string) {
  try {
    const storedValue = window.sessionStorage.getItem(getScrollStorageKey(pathname));

    if (!storedValue) {
      return new Set<LandingScrollDepth>();
    }

    return new Set(JSON.parse(storedValue) as LandingScrollDepth[]);
  } catch {
    return new Set<LandingScrollDepth>();
  }
}

function persistReachedDepths(
  pathname: string,
  reachedDepths: Set<LandingScrollDepth>,
) {
  try {
    window.sessionStorage.setItem(
      getScrollStorageKey(pathname),
      JSON.stringify(Array.from(reachedDepths)),
    );
  } catch {
    // Session storage can be unavailable in some privacy contexts.
  }
}

function getScrollProgress() {
  const scrollableHeight =
    document.documentElement.scrollHeight - window.innerHeight;

  if (scrollableHeight <= 0) {
    return 100;
  }

  return Math.min(100, (window.scrollY / scrollableHeight) * 100);
}

function useLandingScrollDepth() {
  useEffect(() => {
    const pathname = window.location.pathname;
    const reachedDepths = readReachedDepths(pathname);

    const evaluateScrollDepth = () => {
      const progress = getScrollProgress();

      for (const depth of SCROLL_DEPTHS) {
        if (progress < depth || reachedDepths.has(depth)) {
          continue;
        }

        captureLandingEvent('landing_scroll_depth_reached', { depth });
        reachedDepths.add(depth);
      }

      persistReachedDepths(pathname, reachedDepths);
    };

    evaluateScrollDepth();
    window.addEventListener('scroll', evaluateScrollDepth, { passive: true });
    window.addEventListener('resize', evaluateScrollDepth);

    return () => {
      window.removeEventListener('scroll', evaluateScrollDepth);
      window.removeEventListener('resize', evaluateScrollDepth);
    };
  }, []);
}

function useLandingSectionTracking() {
  useEffect(() => {
    const viewedSections = window.__axelysLandingSectionsViewed ?? new Set();
    window.__axelysLandingSectionsViewed = viewedSections;

    const elements = document.querySelectorAll<HTMLElement>(SECTION_SELECTOR);

    if (!elements.length) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (
            !entry.isIntersecting ||
            entry.intersectionRatio < SECTION_VISIBILITY_THRESHOLD
          ) {
            continue;
          }

          const section = entry.target.getAttribute(
            'data-landing-section',
          ) as LandingSectionId | null;

          if (!section || viewedSections.has(section)) {
            observer.unobserve(entry.target);
            continue;
          }

          captureLandingEvent('landing_section_viewed', { section });
          viewedSections.add(section);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: [SECTION_VISIBILITY_THRESHOLD],
      },
    );

    for (const element of elements) {
      const section = element.getAttribute(
        'data-landing-section',
      ) as LandingSectionId | null;

      if (!section || viewedSections.has(section)) {
        continue;
      }

      observer.observe(element);
    }

    return () => observer.disconnect();
  }, []);
}

export function LandingAnalytics() {
  useLandingScrollDepth();
  useLandingSectionTracking();

  useEffect(() => {
    if (window.__axelysLandingViewed) {
      return;
    }

    window.__axelysLandingViewed = true;
    captureLandingEvent('landing_viewed');
  }, []);

  return null;
}
