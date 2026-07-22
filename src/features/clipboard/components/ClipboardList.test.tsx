import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClipboardList } from './ClipboardList';
import * as useClipboardModule from '../hooks/useClipboard';
import * as useSearchModule from '../../search/hooks/useSearch';

vi.mock('../../search/hooks/useSearch');

vi.mock('../hooks/useClipboard');
vi.mock('../../../stores/ui-store', () => ({
  useUIStore: vi.fn().mockReturnValue({
    searchQuery: '',
    selectedClipId: null,
    selectClip: vi.fn(),
  })
}));
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: () => ({
    getVirtualItems: () => [],
    getTotalSize: () => 0,
    scrollToIndex: vi.fn(),
  })
}));

describe('ClipboardList', () => {
  beforeEach(() => {
    vi.mocked(useClipboardModule.useClipboard).mockReturnValue({
      clips: [],
      isLoading: true,
      error: null,
      deleteClip: vi.fn(),
      toggleFavorite: vi.fn(),
      togglePin: vi.fn(),
    } as any);
    vi.mocked(useSearchModule.useSearch).mockReturnValue({
      results: [],
      debouncedQuery: '',
      isLoading: false,
      error: null,
    } as any);
  });

  it('renders spinner when loading', () => {
    render(<ClipboardList />);
    expect(screen.getByTestId('clipboard-list-loading')).toBeInTheDocument();
  });

  it('renders list when loaded', () => {
    vi.mocked(useClipboardModule.useClipboard).mockReturnValue({
      clips: [{ id: 1, text_content: 'test' }],
      isLoading: false,
      error: null,
      deleteClip: vi.fn(),
      toggleFavorite: vi.fn(),
      togglePin: vi.fn(),
    } as any);
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ClipboardList />
      </QueryClientProvider>
    );
    expect(screen.getByTestId('clipboard-list')).toBeInTheDocument();
  });

  it('renders empty state when not loading and empty', () => {
    vi.mocked(useClipboardModule.useClipboard).mockReturnValue({
      clips: [],
      isLoading: false,
      error: null,
      deleteClip: vi.fn(),
      toggleFavorite: vi.fn(),
      togglePin: vi.fn(),
    } as any);
    
    render(<ClipboardList />);
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });
});
