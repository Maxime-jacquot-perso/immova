'use client';

import type { ComponentPropsWithoutRef, MouseEvent } from 'react';
import {
  captureLandingEvent,
  type LandingCtaLocation,
} from '../../lib/posthog-client';

type LandingCtaLinkProps = ComponentPropsWithoutRef<'a'> & {
  location: LandingCtaLocation;
  label: string;
  target: string;
};

export function LandingCtaLink({
  location,
  label,
  target,
  onClick,
  ...props
}: LandingCtaLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);

    if (event.defaultPrevented) {
      return;
    }

    captureLandingEvent('landing_cta_clicked', {
      location,
      label,
      target,
    });
  };

  return <a {...props} onClick={handleClick} />;
}
