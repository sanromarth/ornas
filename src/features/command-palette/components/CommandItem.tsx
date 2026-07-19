/** CommandItem — a single command row in the palette. */
interface Props { label: string; shortcut?: string; onSelect: () => void; }
export function CommandItem({ label, shortcut, onSelect }: Props) {
  return <div role="option" onClick={onSelect}>{label}{shortcut && <kbd>{shortcut}</kbd>}</div>;
}
