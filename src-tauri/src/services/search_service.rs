//! Search service — coordinates FTS5 queries with fuzzy re-ranking.
//!
//! Delegates search to the SearchRepository and provides
//! index maintenance operations.

use crate::domain::clip::Clip;
use crate::domain::traits::{ClipRepository, SearchRepository};
use crate::error::AppError;
use crate::services::crypto_service::CryptoService;
use std::sync::Arc;

/// Search service that coordinates full-text search operations.
pub struct SearchService {
    search_repo: Arc<dyn SearchRepository>,
    crypto_service: Arc<CryptoService>,
    clip_repo: Arc<dyn ClipRepository>,
}

impl SearchService {
    /// Creates a new search service.
    pub fn new(
        search_repo: Arc<dyn SearchRepository>,
        crypto_service: Arc<CryptoService>,
        clip_repo: Arc<dyn ClipRepository>,
    ) -> Self {
        Self {
            search_repo,
            crypto_service,
            clip_repo,
        }
    }

    /// Performs a full-text search with the given query.
    pub fn search(
        &self,
        query: &str,
        limit: u32,
        params: &crate::domain::traits::ListParams,
    ) -> Result<Vec<Clip>, AppError> {
        if query.trim().is_empty() {
            return Ok(Vec::new());
        }

        let mut fts_results = self.search_repo.search(query, limit, params)?;

        // If the vault is unlocked, search encrypted clips in memory
        if self
            .crypto_service
            .get_status()
            .unwrap_or(crate::domain::vault::VaultStatus {
                is_initialized: false,
                is_unlocked: false,
            })
            .is_unlocked
        {
            let encrypted_clips = self.clip_repo.get_encrypted_clips()?;
            let query_lower = query.to_lowercase();

            for mut clip in encrypted_clips {
                if let (Some(blob), Some(nonce)) = (&clip.encrypted_blob, &clip.nonce) {
                    if let Ok(payload) = self.crypto_service.decrypt(blob, nonce) {
                        let mut matches = false;

                        if let Some(text) = &payload.content_text {
                            if text.to_lowercase().contains(&query_lower) {
                                matches = true;
                            }
                        }

                        if !matches {
                            if let Some(preview) = &payload.preview {
                                if preview.to_lowercase().contains(&query_lower) {
                                    matches = true;
                                }
                            }
                        }

                        if matches {
                            // Populate plaintext for preview (in-memory only, never persisted)
                            clip.content_text = payload.content_text;
                            clip.content_html = payload.content_html;
                            clip.content_rtf = payload.content_rtf;
                            clip.preview = payload.preview;

                            // Prevent duplicates if by some error it was in FTS
                            if !fts_results.iter().any(|c| c.id == clip.id) {
                                fts_results.push(clip);
                            }
                        }
                    }
                }
            }

            // Re-sort results descending by created_at since we added in-memory matches
            fts_results.sort_by_key(|b| std::cmp::Reverse(b.created_at));

            // Truncate to limit
            if fts_results.len() > limit as usize {
                fts_results.truncate(limit as usize);
            }
        }

        Ok(fts_results)
    }

    /// Optimizes the FTS5 index (called during idle or shutdown).
    #[allow(dead_code)]
    pub fn optimize_index(&self) -> Result<(), AppError> {
        self.search_repo.optimize_index()
    }

    /// Rebuilds the FTS5 index from scratch.
    #[allow(dead_code)]
    pub fn rebuild_index(&self) -> Result<(), AppError> {
        self.search_repo.rebuild_index()
    }
}
