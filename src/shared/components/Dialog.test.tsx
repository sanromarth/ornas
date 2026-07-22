import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Dialog } from './Dialog';

describe('Dialog', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  const renderDialog = (props = {}) => {
    const defaultProps = {
      isOpen: true,
      onClose: () => {},
      title: 'Test Title',
      children: <div data-testid="dialog-content">Content</div>,
    };
    const ui = <Dialog {...defaultProps} {...props} />;
    const view = render(ui);
    act(() => {
      vi.runAllTimers();
    });
    return view;
  };

  it('renders children when open', () => {
    renderDialog();
    expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderDialog({ isOpen: false });
    expect(screen.queryByTestId('dialog-content')).not.toBeInTheDocument();
  });

  it('calls onClose when clicking outside (backdrop)', () => {
    const onClose = vi.fn();
    const { container } = renderDialog({ onClose });
    
    // The outermost div is the backdrop
    const backdrop = container.firstChild as HTMLElement;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    renderDialog({ onClose });
    
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
