//! Stage 2: Hasher — compute xxHash64 of normalized content.

use crate::domain::pipeline::{ClipItem, PipelineStage, StageAction};
use crate::error::AppError;
use xxhash_rust::xxh64::Xxh64;

pub struct Hasher;

impl PipelineStage for Hasher {
    fn name(&self) -> &'static str {
        "hasher"
    }

    fn process(&self, item: &mut ClipItem) -> Result<StageAction, AppError> {
        let mut hasher = Xxh64::new(0);

        if let Some(text) = &item.content_text {
            hasher.update(text.as_bytes());
        }
        if let Some(bytes) = &item.image_bytes {
            hasher.update(bytes);
        }
        if let Some(html) = &item.content_html {
            hasher.update(html.as_bytes());
        }
        if let Some(rtf) = &item.content_rtf {
            hasher.update(rtf.as_bytes());
        }

        item.content_hash = format!("{:016x}", hasher.digest());

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
