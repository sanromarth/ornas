/** TanStack Query keys for clipboard queries. */

export const clipboardKeys = {
  all: ['clips'] as const,
  lists: () => [...clipboardKeys.all, 'list'] as const,
  list: (params: object) => [...clipboardKeys.lists(), params] as const,
  details: () => [...clipboardKeys.all, 'detail'] as const,
  detail: (id: number) => [...clipboardKeys.details(), id] as const,
};
