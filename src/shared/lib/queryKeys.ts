/** Centralized TanStack Query keys. */

export const clipboardKeys = {
  all: ['clips'] as const,
  lists: () => [...clipboardKeys.all, 'list'] as const,
  list: (params: object) => [...clipboardKeys.lists(), params] as const,
  details: () => [...clipboardKeys.all, 'detail'] as const,
  detail: (id: number) => [...clipboardKeys.details(), id] as const,
  searches: () => [...clipboardKeys.all, 'search'] as const,
  search: (query: string, params?: object) => [...clipboardKeys.searches(), { query, params }] as const,
  collections: (id: number) => [...clipboardKeys.all, 'collections', id] as const,
  tags: (id: number) => [...clipboardKeys.all, 'tags', id] as const,
  counts: () => [...clipboardKeys.all, 'counts'] as const,
};

export const settingsKeys = {
  all: ['settings'] as const,
};

export const systemKeys = {
  platform: ['system', 'platform'] as const,
  diagnostics: ['system', 'diagnostics'] as const,
};
