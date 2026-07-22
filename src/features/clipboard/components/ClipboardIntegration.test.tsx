import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClipboardList } from './ClipboardList';
import { ClipboardPreview } from './ClipboardPreview';
import { invoke } from '@tauri-apps/api/core';


vi.mock('@tauri-apps/api/core');

const mockClips = [
  {
    id: 1,
    content_type: 'text',
    content_text: 'First Clip Data',
    preview: 'First Clip Data',
    char_count: 15,
    line_count: 1,
    category: 'text',
    is_favorite: false,
    is_pinned: false,
    created_at: 1000,
  },
  {
    id: 2,
    content_type: 'text',
    content_text: 'Second Clip Data',
    preview: 'Second Clip Data',
    char_count: 16,
    line_count: 1,
    category: 'text',
    is_favorite: false,
    is_pinned: false,
    created_at: 2000,
  }
];

describe('Clipboard Integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.mocked(invoke).mockImplementation(async (cmd, args) => {
      if (cmd === 'list_clips') return mockClips;
      if (cmd === 'get_clip') return mockClips.find(c => c.id === (args as { id: number }).id) || null;
      if (cmd === 'search_clips') return [];
      return null;
    });
  });

  const renderApp = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <div className="flex">
          <ClipboardList />
          <ClipboardPreview />
        </div>
      </QueryClientProvider>
    );
  };

  it('selects an item in the list and shows it in the preview', async () => {
    renderApp();
    
    // Wait for list to load
    const clip1 = await screen.findByTestId('clip-1');
    const clip2 = await screen.findByTestId('clip-2');
    
    // By default, the first clip might be selected if useUIStore had logic, but let's select clip 2
    fireEvent.click(clip2);
    
    // Preview should now show clip 2 details
    const previewContent = await screen.findByTestId('clipboard-preview');
    expect(previewContent).toHaveTextContent('Second Clip Data');
    
    // Select clip 1
    fireEvent.click(clip1);
    
    // Preview should update to clip 1
    const newPreviewContent = await screen.findByTestId('clipboard-preview');
    expect(newPreviewContent).toHaveTextContent('First Clip Data');
  });
});
