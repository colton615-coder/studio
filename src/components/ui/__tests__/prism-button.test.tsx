import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { PrismButton } from '../prism-button';

// Mock framer-motion's useReducedMotion to simulate reduced motion environment
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<any>('framer-motion');
  return { ...actual, useReducedMotion: () => true };
});

describe('PrismButton reduced-motion behavior', () => {
  it('does not render success particles when reduced motion is preferred', () => {
    const { container } = render(<PrismButton variant="emerald" success loading={false}>Test</PrismButton>);
    // Success container would have animate-prism-particle spans; ensure absent
    const particles = container.querySelectorAll('.animate-prism-particle');
    expect(particles.length).toBe(0);
  });
});
