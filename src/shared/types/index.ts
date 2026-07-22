/** Shared TypeScript types mirroring Rust domain entities. */

/** Content type classification. */
export type ContentType = 'text' | 'image' | 'rich_text' | 'file';

/** A clipboard entry stored in the database. */
export interface ClipDto {
  id: number;
  content_text: string | null;
  content_html: string | null;
  content_rtf: string | null;
  image_path: string | null;
  content_type: ContentType;
  category: string;
  source_app: string | null;
  content_hash: string;
  preview: string | null;
  char_count: number;
  line_count: number;
  is_favorite: boolean;
  is_pinned: boolean;
  language: string | null;
  is_code: boolean;
  detection_confidence: number;
  language_source: string;
  is_encrypted?: boolean;
  encryption_version?: number;
  /** Unix epoch seconds. */
  created_at: number;
  /** Unix epoch seconds. */
  updated_at: number;
  /** Associated files (if content_type === 'file') */
  files?: ClipFileDto[];
}

/** Represents a file copied to the clipboard. */
export interface ClipFileDto {
  id: number;
  clip_id: number;
  file_path: string;
  file_name: string;
  extension: string;
  mime_type: string;
  file_size: number;
  is_dir: boolean;
  is_readonly: boolean;
  created_time: number;
  modified_time: number;
  hash: string;
  thumbnail_path?: string;
  status: string;
  selection_group: number;
  icon_type?: string;
  created_at: number;
  updated_at: number;
}

export interface VaultStatus {
  is_initialized: boolean;
  is_unlocked: boolean;
}

export interface DecryptedPayloadResponse {
  content_text?: string;
  content_html?: string;
  content_rtf?: string;
  preview?: string;
}

/** Parameters for paginated list queries. */
export interface ListParams {
  limit?: number;
  cursor_pinned?: boolean;
  cursor_created_at?: number;
  cursor_id?: number;
  category?: string;
  favorites_only?: boolean;
  pinned_only?: boolean;
  collection_id?: number;
  tag_id?: number;
}

/** Application settings as key-value pairs. */
export type SettingsDto = Record<string, string>;


/** Event payload sent by Tauri when a clip changes. */
export interface ClipboardEventDto {
  id: number;
}
