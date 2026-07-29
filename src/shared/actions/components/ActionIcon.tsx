import { memo } from 'react';
import {
  Settings,
  Command,
  Keyboard,
  SunMoon,
  PanelLeft,
  List,
  Eye,
  Search,
  X,
  Copy,
  Trash2,
  Star,
  Pin,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  FolderPlus,
  Tag,
  Lock,
  Clipboard,
  Image,
  Code,
  Link,
  FileText,
  Download,
  Upload,
  Unlock,
  Terminal,
  type LucideProps
} from 'lucide-react';

const ICON_MAP: Record<string, React.FC<LucideProps>> = {
  settings: Settings,
  command: Command,
  keyboard: Keyboard,
  'sun-moon': SunMoon,
  'panel-left': PanelLeft,
  list: List,
  eye: Eye,
  search: Search,
  x: X,
  copy: Copy,
  'trash-2': Trash2,
  star: Star,
  pin: Pin,
  'chevron-up': ChevronUp,
  'chevron-down': ChevronDown,
  'chevrons-up': ChevronsUp,
  'chevrons-down': ChevronsDown,
  'folder-plus': FolderPlus,
  tag: Tag,
  lock: Lock,
  clipboard: Clipboard,
  image: Image,
  code: Code,
  link: Link,
  file: FileText,
  download: Download,
  upload: Upload,
  unlock: Unlock,
};

interface ActionIconProps extends LucideProps {
  name?: string;
}

export const ActionIcon = memo(function ActionIcon({ name, className, size = 16, ...props }: ActionIconProps) {
  if (!name) return <Terminal size={size} className={className} {...props} />;
  const IconComponent = ICON_MAP[name] || Terminal;
  return <IconComponent size={size} className={className} {...props} />;
});
