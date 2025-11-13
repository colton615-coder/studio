import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import Splashscreen from '../Splashscreen';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<any>('framer-motion');
  return {
    ...actual,
    motion: {
      div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
  };
});

// Mock the affirmations data
vi.mock('@/data/affirmations.json', () => ({
  default: [
    'You are capable of amazing things.',
    'Every day is a fresh start.',
    'Progress, not perfection.',
  ],
}));

describe('Splashscreen', () => {
  it('renders the LiFE-iN-SYNC branding', () => {
    const { container } = render(<Splashscreen />);
    const heading = container.querySelector('h1');
    expect(heading?.textContent).toBe('LiFE-iN-SYNC');
  });

  it('displays an affirmation or default text', () => {
    const { container } = render(<Splashscreen />);
    const affirmationText = container.querySelector('.text-muted-foreground.mb-6');
    expect(affirmationText?.textContent).toBeTruthy();
  });

  it('shows the loading indicator text', () => {
    const { container } = render(<Splashscreen />);
    const textElements = Array.from(container.querySelectorAll('span'));
    const hasInitializing = textElements.some(el => el.textContent?.includes('Initializing...'));
    expect(hasInitializing).toBe(true);
  });

  it('has proper styling classes for neumorphic design', () => {
    const { container } = render(<Splashscreen />);
    // Check for neumorphic shadow classes
    const neumorphicElements = container.querySelectorAll('[class*="shadow-neumorphic"]');
    expect(neumorphicElements.length).toBeGreaterThan(0);
  });

  it('displays the Bot icon', () => {
    const { container } = render(<Splashscreen />);
    // Check for the bot icon SVG
    const botIcon = container.querySelector('.lucide-bot');
    expect(botIcon).toBeTruthy();
  });

  it('displays the loading spinner', () => {
    const { container } = render(<Splashscreen />);
    // Check for the loader icon
    const loader = container.querySelector('.animate-spin');
    expect(loader).toBeTruthy();
  });
});
