//! Stage 3: Dedup — check hash against LRU cache and database.
//!
//! Uses an in-memory LRU cache for fast duplicate detection.
//! Falls back to a database lookup on cache miss.

use crate::domain::pipeline::{ClipItem, PipelineStage, StageAction};
use crate::domain::traits::ClipRepository;
use crate::error::AppError;
use std::collections::VecDeque;
use std::sync::{Arc, Mutex};

/// LRU cache for content hashes used for fast dedup checks.
struct LruCache {
    entries: VecDeque<String>,
    capacity: usize,
}

impl LruCache {
    /// Creates a new LRU cache with the given capacity.
    fn new(capacity: usize) -> Self {
        Self {
            entries: VecDeque::with_capacity(capacity),
            capacity,
        }
    }

    /// Returns true if the hash exists in the cache.
    fn contains(&self, hash: &str) -> bool {
        self.entries.iter().any(|h| h == hash)
    }

    /// Inserts a hash into the cache, evicting the oldest if full.
    fn insert(&mut self, hash: String) {
        // Remove if already present (will re-add at front)
        self.entries.retain(|h| h != &hash);
        if self.entries.len() >= self.capacity {
            self.entries.pop_back();
        }
        self.entries.push_front(hash);
    }
}

/// Stage 3: Duplicate detection via LRU cache + database fallback.
///
/// If a duplicate is found, bumps the existing item's `updated_at`
/// and returns `StageAction::Skip`.
pub struct Dedup {
    cache: Mutex<LruCache>,
    clip_repo: Arc<dyn ClipRepository>,
}

impl Dedup {
    /// Creates a new Dedup stage with the given cache size and repository.
    pub fn new(cache_size: usize, clip_repo: Arc<dyn ClipRepository>) -> Self {
        Self {
            cache: Mutex::new(LruCache::new(cache_size)),
            clip_repo,
        }
    }
}

impl PipelineStage for Dedup {
    fn name(&self) -> &'static str {
        "dedup"
    }

    fn process(&self, item: &mut ClipItem) -> Result<StageAction, AppError> {
        let hash = &item.content_hash;
        if hash.is_empty() {
            return Ok(StageAction::Continue);
        }

        // Check LRU cache first
        {
            let cache = self
                .cache
                .lock()
                .map_err(|_| AppError::Internal("Dedup cache lock poisoned".into()))?;
            if cache.contains(hash) {
                // Bump existing item's updated_at
                if let Some(existing) = self.clip_repo.find_by_hash(hash)? {
                    self.clip_repo.touch(existing.id)?;
                    tracing::debug!(stage = self.name(), hash = %hash, id = existing.id, "LRU cache hit — duplicate skipped");
                }
                return Ok(StageAction::Skip {
                    reason: "duplicate (LRU cache hit)",
                });
            }
        }

        // Check database on cache miss
        if let Some(existing) = self.clip_repo.find_by_hash(hash)? {
            self.clip_repo.touch(existing.id)?;
            // Add to LRU cache for future lookups
            let mut cache = self
                .cache
                .lock()
                .map_err(|_| AppError::Internal("Dedup cache lock poisoned".into()))?;
            cache.insert(hash.clone());
            tracing::debug!(stage = self.name(), hash = %hash, id = existing.id, "DB hit — duplicate skipped");
            return Ok(StageAction::Skip {
                reason: "duplicate (database hit)",
            });
        }

        // Unique — add to cache
        let mut cache = self
            .cache
            .lock()
            .map_err(|_| AppError::Internal("Dedup cache lock poisoned".into()))?;
        cache.insert(hash.clone());
        tracing::debug!(stage = self.name(), hash = %hash, "unique content — continuing");

        Ok(StageAction::Continue)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::clip::{Clip, ClipUpdate, ContentType, NewClip};
    use crate::domain::traits::ListParams;

    /// In-memory mock repository for testing dedup logic.
    struct MockClipRepo {
        clips: Mutex<Vec<Clip>>,
    }

    impl MockClipRepo {
        fn new() -> Self {
            Self {
                clips: Mutex::new(Vec::new()),
            }
        }
    }

    impl ClipRepository for MockClipRepo {
        fn create(&self, clip: &NewClip) -> Result<Clip, AppError> {
            let mut clips = self
                .clips
                .lock()
                .map_err(|_| AppError::Internal("mock lock".into()))?;
            let id = clips.len() as i64 + 1;
            let c = Clip {
                id,
                content_text: clip.content_text.clone(),
                content_html: None,
                content_rtf: None,
                image_path: None,
                content_type: ContentType::Text,
                category: "plain_text".into(),
                source_app: None,
                content_hash: clip.content_hash.clone(),
                preview: None,
                char_count: 0,
                line_count: 0,
                is_favorite: false,
                is_pinned: false,
                created_at: 0,
                updated_at: 0,
                files: None,
                language: None,
                is_code: false,
                detection_confidence: 0.0,
                language_source: "auto".to_string(),
                is_encrypted: false,
                encryption_version: None,
                encrypted_blob: None,
                nonce: None,
            };
            clips.push(c.clone());
            Ok(c)
        }
        fn get_by_id(&self, _id: i64) -> Result<Option<Clip>, AppError> {
            Ok(None)
        }
        fn list(&self, _params: &ListParams) -> Result<Vec<Clip>, AppError> {
            Ok(vec![])
        }
        fn update(&self, _id: i64, _update: &ClipUpdate) -> Result<Clip, AppError> {
            Err(AppError::NotFound("not impl".into()))
        }
        fn delete(&self, _id: i64) -> Result<(), AppError> {
            Ok(())
        }
        fn find_by_hash(&self, hash: &str) -> Result<Option<Clip>, AppError> {
            let clips = self
                .clips
                .lock()
                .map_err(|_| AppError::Internal("mock lock".into()))?;
            Ok(clips.iter().find(|c| c.content_hash == hash).cloned())
        }
        fn set_favorite(&self, _id: i64, _fav: bool) -> Result<(), AppError> {
            Ok(())
        }
        fn set_pinned(&self, _id: i64, _pin: bool) -> Result<(), AppError> {
            Ok(())
        }
        fn touch(&self, _id: i64) -> Result<(), AppError> {
            Ok(())
        }
        fn prune_older_than(&self, _max: i64) -> Result<u64, AppError> {
            Ok(0)
        }
        fn count(&self) -> Result<u64, AppError> {
            Ok(0)
        }
        fn get_encrypted_clips(&self) -> Result<Vec<Clip>, AppError> {
            Ok(vec![])
        }
    }

    #[test]
    fn test_dedup_unique_items() {
        let repo = Arc::new(MockClipRepo::new());
        let dedup = Dedup::new(10, repo);

        let mut item1 = ClipItem::from_text("hello".into());
        item1.content_hash = "aaa".into();
        let result = dedup.process(&mut item1);
        assert!(matches!(result, Ok(StageAction::Continue)));

        let mut item2 = ClipItem::from_text("world".into());
        item2.content_hash = "bbb".into();
        let result = dedup.process(&mut item2);
        assert!(matches!(result, Ok(StageAction::Continue)));
    }

    #[test]
    fn test_dedup_lru_cache_hit() {
        let repo = Arc::new(MockClipRepo::new());
        let dedup = Dedup::new(10, repo);

        let mut item1 = ClipItem::from_text("hello".into());
        item1.content_hash = "aaa".into();
        let _ = dedup.process(&mut item1);

        // Same hash again — should skip via LRU cache
        let mut item2 = ClipItem::from_text("hello".into());
        item2.content_hash = "aaa".into();
        let result = dedup.process(&mut item2);
        assert!(matches!(result, Ok(StageAction::Skip { .. })));
    }

    #[test]
    fn test_dedup_db_fallback() {
        let repo = Arc::new(MockClipRepo::new());
        // Pre-populate the repo with a clip
        let new_clip = NewClip {
            content_text: Some("existing".into()),
            content_html: None,
            content_rtf: None,
            image_path: None,
            content_type: ContentType::Text,
            category: "plain_text".into(),
            source_app: None,
            content_hash: "existing_hash".into(),
            preview: None,
            char_count: 0,
            line_count: 0,
            language: None,
            is_code: false,
            detection_confidence: 0.0,
            language_source: "auto".to_string(),
            is_encrypted: false,
            encryption_version: None,
            encrypted_blob: None,
            nonce: None,
        };
        repo.create(&new_clip).ok();

        // Create dedup with fresh cache (no LRU entry)
        let dedup = Dedup::new(10, repo);
        let mut item = ClipItem::from_text("existing".into());
        item.content_hash = "existing_hash".into();
        let result = dedup.process(&mut item);
        assert!(matches!(result, Ok(StageAction::Skip { .. })));
    }
}
