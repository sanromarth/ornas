import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchBar } from './SearchBar';
import * as useSearchModule from '../hooks/useSearch';

vi.mock('../hooks/useSearch');

describe('SearchBar', () => {
  beforeEach(() => {
    vi.mocked(useSearchModule.useSearch).mockReturnValue({
      query: '',
      setQuery: vi.fn(),
      clearSearch: vi.fn(),
      debouncedQuery: '',
      results: [],
      isLoading: false,
      error: null,
    });
  });

  it('renders correctly', () => {
    render(<SearchBar />);
    expect(screen.getByPlaceholderText('Search clipboard…')).toBeInTheDocument();
  });

  it('calls setQuery on input', () => {
    const setQueryMock = vi.fn();
    vi.mocked(useSearchModule.useSearch).mockReturnValue({
      query: '',
      setQuery: setQueryMock,
      clearSearch: vi.fn(),
      debouncedQuery: '',
      results: [],
      isLoading: false,
      error: null,
    });

    render(<SearchBar />);
    const input = screen.getByPlaceholderText('Search clipboard…');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(setQueryMock).toHaveBeenCalledWith('test');
  });

  it('shows clear button when query exists', () => {
    const clearSearchMock = vi.fn();
    vi.mocked(useSearchModule.useSearch).mockReturnValue({
      query: 'test',
      setQuery: vi.fn(),
      clearSearch: clearSearchMock,
      debouncedQuery: 'test',
      results: [],
      isLoading: false,
      error: null,
    });

    render(<SearchBar />);
    const clearButton = screen.getByLabelText('Clear search');
    expect(clearButton).toBeInTheDocument();
    
    fireEvent.click(clearButton);
    expect(clearSearchMock).toHaveBeenCalled();
  });
});
