/** Centralized TanStack Query keys. */

export const clipboardKeys = {
  all: ['clips'] as const,
  lists: () => [...clipboardKeys.all, 'list'] as const,
  list: (params: object) => [...clipboardKeys.lists(), params] as const,
  details: () => [...clipboardKeys.all, 'detail'] as const,
  detail: (id: number) => [...clipboardKeys.details(), id] as const,
  searches: () => [...clipboardKeys.all, 'search'] as const,
  search: (query: string, limit?: number) => [...clipboardKeys.searches(), { query, limit }] as const,
};

export const settingsKeys = {
  all: ['settings'] as const,
};
