//! Stage 2: Hasher — compute xxHash64 of normalized content.

use crate::domain::pipeline::{ClipItem, PipelineStage, StageAction};
use crate::error::AppError;
use xxhash_rust::xxh64::xxh64;

pub struct Hasher;

impl PipelineStage for Hasher {
    fn name(&self) -> &'static str {
        "hasher"
    }

    fn process(&self, item: &mut ClipItem) -> Result<StageAction, AppError> {
        let content = item.content_text.as_deref().unwrap_or("");
        let hash_value = xxh64(content.as_bytes(), 0);
        item.content_hash = format!("{:016x}", hash_value);

        tracing::debug!(stage = self.name(), hash = %item.content_hash, "content hashed");
        Ok(StageAction::Continue)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hasher() {
        let hasher = Hasher;
        let mut item = ClipItem::from_text("hello".to_string());

        let result = hasher.process(&mut item).unwrap();
        assert!(matches!(result, StageAction::Continue));
        assert_eq!(item.content_hash.len(), 16);
    }
}
