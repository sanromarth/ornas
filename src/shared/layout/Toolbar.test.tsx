import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toolbar } from './Toolbar';
import * as uiStoreModule from '../../stores/ui-store';

vi.mock('../../stores/ui-store');

describe('Toolbar', () => {
  it('renders branding and settings button', () => {
    vi.mocked(uiStoreModule.useUIStore).mockReturnValue({
      settingsOpen: false,
      toggleSettings: vi.fn(),
    } as unknown as ReturnType<typeof uiStoreModule.useUIStore>);

    render(<Toolbar />);
    
    // Check branding
    expect(screen.getByText('ORNAS')).toBeInTheDocument();
    
    // Check settings button
    expect(screen.getByLabelText('Settings')).toBeInTheDocument();
  });

  it('calls toggleSettings when settings button is clicked', () => {
    const toggleSettingsMock = vi.fn();
    vi.mocked(uiStoreModule.useUIStore).mockReturnValue({
      settingsOpen: false,
      toggleSettings: toggleSettingsMock,
    } as unknown as ReturnType<typeof uiStoreModule.useUIStore>);

    render(<Toolbar />);
    
    fireEvent.click(screen.getByLabelText('Settings'));
    expect(toggleSettingsMock).toHaveBeenCalled();
  });
});
