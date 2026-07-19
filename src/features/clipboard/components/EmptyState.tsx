/** EmptyState — shown when there are no clipboard items. */


/** Renders a friendly empty state with guidance. */
export function EmptyState() {
  return (
    <div data-testid="empty-state" className="flex items-center justify-center h-full">
      <p>Copy something to get started</p>
    </div>
  );
}
