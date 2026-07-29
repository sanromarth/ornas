/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/core');
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn().mockResolvedValue(() => {}),
  emit: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: () => ({
    onFocusChanged: vi.fn().mockResolvedValue(() => {}),
  }),
}));

let renderCounts: Record<string, number> = {};

vi.mock('../shared/layout/Sidebar', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../shared/layout/Sidebar')>();
  const react = await import('react');
  const MemoSidebar = react.memo((props: Record<string, unknown>) => {
    renderCounts['Sidebar'] = (renderCounts['Sidebar'] || 0) + 1;
    return <actual.Sidebar {...(props as any)} />;
  });
  return { ...actual, Sidebar: MemoSidebar };
});

vi.mock('../shared/layout/Toolbar', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../shared/layout/Toolbar')>();
  const react = await import('react');
  const MemoToolbar = react.memo((props: Record<string, unknown>) => {
    renderCounts['Toolbar'] = (renderCounts['Toolbar'] || 0) + 1;
    return <actual.Toolbar {...(props as any)} />;
  });
  return { ...actual, Toolbar: MemoToolbar };
});

vi.mock('../features/search', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../features/search')>();
  const react = await import('react');
  const MemoSearchBar = react.memo((props: Record<string, unknown>) => {
    renderCounts['SearchBar'] = (renderCounts['SearchBar'] || 0) + 1;
    return <actual.SearchBar {...(props as any)} />;
  });
  return { ...actual, SearchBar: MemoSearchBar };
});

vi.mock('../features/clipboard', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../features/clipboard')>();
  const react = await import('react');
  const MemoClipboardList = react.memo((props: Record<string, unknown>) => {
    renderCounts['ClipboardList'] = (renderCounts['ClipboardList'] || 0) + 1;
    return <actual.ClipboardList {...(props as any)} />;
  });
  const MemoClipboardPreview = react.memo((props: Record<string, unknown>) => {
    renderCounts['ClipboardPreview'] = (renderCounts['ClipboardPreview'] || 0) + 1;
    return <actual.ClipboardPreview {...(props as any)} />;
  });
  const MemoFilterContextHeader = react.memo((props: Record<string, unknown>) => {
    renderCounts['FilterContextHeader'] = (renderCounts['FilterContextHeader'] || 0) + 1;
    return <actual.FilterContextHeader {...(props as any)} />;
  });
  return {
    ...actual,
    ClipboardList: MemoClipboardList,
    ClipboardPreview: MemoClipboardPreview,
    FilterContextHeader: MemoFilterContextHeader,
  };
});

describe('App Resize Profiling', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    renderCounts = {};
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.mocked(invoke).mockImplementation(async (cmd) => {
      if (cmd === 'list_clips' || cmd === 'search_clips') return [];
      if (cmd === 'get_filter_counts') return { all: 0, favorites: 0, pinned: 0, images: 0, code: 0, links: 0, files: 0 };
      if (cmd === 'list_collections') return [];
      if (cmd === 'list_tags') return [];
      if (cmd === 'get_settings') return { theme: 'dark', retention_days: 30, hotkey: 'Ctrl+Shift+V' };
      if (cmd === 'get_vault_status') return { is_unlocked: false, has_vault: false };
      return null;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('measures component rerenders during 50 mousemove events while dragging splitter', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    console.log('--- Initial Render Counts ---', renderCounts);

    const splitters = screen.getAllByRole('separator');
    const sidebarSplitter = splitters[0];

    renderCounts = {};

    fireEvent.mouseDown(sidebarSplitter, { clientX: 250, button: 0 });

    for (let i = 1; i <= 50; i++) {
      act(() => {
        fireEvent.mouseMove(document, { clientX: 250 + i });
      });
    }

    fireEvent.mouseUp(document);

    console.log('--- Render Counts During 50 Drag Moves ---', renderCounts);

    const totalRenders = Object.values(renderCounts).reduce((a, b) => a + b, 0);
    console.log(`Total child component renders during 50 mousemove events: ${totalRenders}`);
    expect(totalRenders).toBe(0);
  });
});
