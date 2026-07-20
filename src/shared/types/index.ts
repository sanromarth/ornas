/** Shared TypeScript types mirroring Rust domain entities. */

/** Content type classification. */
export type ContentType = 'text' | 'image' | 'rich_text';

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
  /** Unix epoch seconds. */
  created_at: number;
  /** Unix epoch seconds. */
  updated_at: number;
}

/** Parameters for paginated list queries. */
export interface ListParams {
  limit?: number;
  offset?: number;
  category?: string;
  favorites_only?: boolean;
  pinned_only?: boolean;
}

/** Application settings as key-value pairs. */
export type SettingsDto = Record<string, string>;


/** Event payload sent by Tauri when a clip changes. */
export interface ClipboardEventDto {
  id: number;
}
