import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SettingsPanel } from './SettingsPanel';
import * as useSettingsModule from '../hooks/useSettings';

vi.mock('../hooks/useSettings');
vi.mock('../../../shared/components/Dialog', () => ({
  Dialog: ({ children, isOpen, onClose }: { children: React.ReactNode, isOpen: boolean, onClose: () => void }) => (
    isOpen ? (
      <div data-testid="mock-dialog">
        <button onClick={onClose} data-testid="close-dialog">Close</button>
        {children}
      </div>
    ) : null
  ),
}));

vi.mock('../../../stores/ui-store', () => ({
  useUIStore: () => ({
    settingsOpen: true,
  }),
}));

describe('SettingsPanel', () => {
  const updateSettingMock = vi.fn().mockResolvedValue(undefined);
  
  beforeEach(() => {
    vi.mocked(useSettingsModule.useSettings).mockReturnValue({
      settings: {
        retention_days: '30',
        history_max_size: '5000',
        theme: 'dark',
        excluded_apps: 'Terminal'
      },
      isLoading: false,
      error: null,
      updateSetting: updateSettingMock,
    } as unknown as ReturnType<typeof useSettingsModule.useSettings>);
    vi.clearAllMocks();
  });

  it('renders settings fields', () => {
    render(<SettingsPanel onClose={() => {}} />);
    expect(screen.getByLabelText(/Retention Days/i)).toHaveValue(30);
    expect(screen.getByLabelText(/Max History Size/i)).toHaveValue(5000);
    expect(screen.getByLabelText(/Theme/i)).toHaveValue('dark');
    expect(screen.getByLabelText(/Excluded Apps/i)).toHaveValue('Terminal');
  });

  it('calls updateSetting when save button is clicked', async () => {
    render(<SettingsPanel onClose={() => {}} />);
    
    const retentionInput = screen.getByLabelText(/Retention Days/i);
    fireEvent.change(retentionInput, { target: { value: '45' } });
    
    const saveBtns = screen.getAllByText('Save');
    // First save button is for retention
    await act(async () => {
      fireEvent.click(saveBtns[0]);
    });
    
    expect(updateSettingMock).toHaveBeenCalledWith({ key: 'retention_days', value: '45' });
  });
});
