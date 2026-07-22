import { ClipDto } from '../../../shared/types';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClipboardItem } from './ClipboardItem';
import * as mutations from '../api/mutations';


vi.mock('../api/mutations');

const mockClip = {
  id: 1,
  content_type: 'text',
  content_text: 'Hello World',
  preview: 'Hello World',
  char_count: 11,
  line_count: 1,
  is_pinned: false,
  is_favorite: false,
  created_at: Math.floor(Date.now() / 1000),
  category: 'text',
} as unknown as ClipDto;

const renderWithToast = (ui: React.ReactElement) => {
  return render(ui);
};

describe('ClipboardItem', () => {
  const toggleFavoriteMock = vi.fn();
  const togglePinMock = vi.fn();
  const deleteClipMock = vi.fn();

  beforeEach(() => {
    vi.mocked(mutations.useToggleFavorite).mockReturnValue({
      mutate: toggleFavoriteMock,
      isPending: false,
    } as unknown as ReturnType<typeof mutations.useToggleFavorite>);
    vi.mocked(mutations.useTogglePin).mockReturnValue({
      mutate: togglePinMock,
      isPending: false,
    } as unknown as ReturnType<typeof mutations.useTogglePin>);
    vi.mocked(mutations.useDeleteClip).mockReturnValue({
      mutate: deleteClipMock,
      isPending: false,
    } as unknown as ReturnType<typeof mutations.useDeleteClip>);
    vi.clearAllMocks();
  });

  it('renders clip preview and metadata', () => {
    renderWithToast(<ClipboardItem clip={mockClip} isSelected={false} onSelect={() => {}} />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
    expect(screen.getByText('text')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    const onSelect = vi.fn();
    renderWithToast(<ClipboardItem clip={mockClip} isSelected={false} onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId(`clip-${mockClip.id}`));
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it('applies selection styles when isSelected is true', () => {
    renderWithToast(<ClipboardItem clip={mockClip} isSelected={true} onSelect={() => {}} />);
    expect(screen.getByTestId(`clip-${mockClip.id}`)).toHaveClass('bg-selection');
  });

  it('handles favorite action', () => {
    renderWithToast(<ClipboardItem clip={mockClip} isSelected={false} onSelect={() => {}} />);
    const btn = screen.getByLabelText('Add to favorites');
    fireEvent.click(btn);
    expect(toggleFavoriteMock).toHaveBeenCalledWith(1);
  });

  it('shows confirm dialog on delete and triggers mutation on confirm', () => {
    renderWithToast(<ClipboardItem clip={mockClip} isSelected={false} onSelect={() => {}} />);
    
    // Click delete
    fireEvent.click(screen.getByLabelText('Delete item'));
    
    // Dialog should appear
    expect(screen.getByText('Delete Item')).toBeVisible();
    
    // Click confirm in dialog
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    
    expect(deleteClipMock).toHaveBeenCalledWith(1);
  });
});
