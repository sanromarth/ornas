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
  extension: string | null;
  mime_type: string | null;
  file_size: number;
  is_dir: boolean;
  is_readonly: boolean;
  created_time: number | null;
  modified_time: number | null;
  hash: string | null;
  thumbnail_path: string | null;
  status: string;
  selection_group: number;
  icon_type: string;
}

/** Parameters for paginated list queries. */
export interface ListParams {
  limit?: number;
  offset?: number;
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
