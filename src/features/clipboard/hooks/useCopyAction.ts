import { invoke } from '@tauri-apps/api/core';
import { useToast } from '../../../shared/components/useToast';
import type { ClipDto } from '../../../shared/types';
import { writeTextToClipboard } from '../../../services/clipboard';

export function useCopyAction() {
  const { addToast } = useToast();

  const copyClip = async (clip: ClipDto): Promise<boolean> => {
    if (clip.content_type === 'file') {
      try {
        await invoke('restore_files_to_clipboard', { clipId: clip.id });
        addToast({ title: 'Files copied to clipboard', variant: 'success' });
        return true;
      } catch (err: unknown) {
        addToast({ title: 'Failed to copy files', description: (err instanceof Error ? err.message : String(err)) || String(err), variant: 'error' });
        return false;
      }
    }
    
    if (clip.content_type === 'image') {
      try {
        await invoke('restore_image_to_clipboard', { clipId: clip.id });
        addToast({ title: 'Image copied to clipboard', variant: 'success' });
        return true;
      } catch (err: unknown) {
        addToast({ title: 'Failed to copy image', description: (err instanceof Error ? err.message : String(err)) || String(err), variant: 'error' });
        return false;
      }
    }
    
    const content = clip.content_text ?? clip.preview;
    if (content) {
      try {
        await writeTextToClipboard(content);
        addToast({ title: 'Copied to clipboard', variant: 'success' });
        return true;
      } catch (err: unknown) {
        addToast({ title: 'Failed to copy', description: (err instanceof Error ? err.message : String(err)) || String(err), variant: 'error' });
        return false;
      }
    }

    return false;
  };

  return { copyClip };
}
