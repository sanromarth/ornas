import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders history empty state when isSearch is false', () => {
    render(<EmptyState isSearch={false} />);
    expect(screen.getByText('Clipboard is empty')).toBeInTheDocument();
    expect(screen.getByText(/Copy text or images/i)).toBeInTheDocument();
  });

  it('renders search empty state when isSearch is true', () => {
    render(<EmptyState isSearch={true} />);
    expect(screen.getByText('No results found')).toBeInTheDocument();
    expect(screen.getByText(/couldn't find any clips matching/i)).toBeInTheDocument();
  });
});
