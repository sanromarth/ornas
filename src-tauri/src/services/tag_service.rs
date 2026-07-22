//! Tag service — business logic for managing tags.

use crate::domain::tag::{NewTag, Tag, TagUpdate};
use crate::domain::traits::TagRepository;
use crate::error::AppError;
use std::sync::Arc;

pub struct TagService {
    repo: Arc<dyn TagRepository>,
}

impl TagService {
    pub fn new(repo: Arc<dyn TagRepository>) -> Self {
        Self { repo }
    }

    pub fn create_tag(&self, name: String, color: Option<String>) -> Result<Tag, AppError> {
        let name = name.trim().to_string();
        if name.is_empty() {
            return Err(AppError::Validation("Tag name cannot be empty".into()));
        }

        let new_tag = NewTag { name, color };
        self.repo.create(&new_tag)
    }

    pub fn list_tags(&self) -> Result<Vec<Tag>, AppError> {
        self.repo.list()
    }

    pub fn update_tag(&self, id: i64, update: TagUpdate) -> Result<Tag, AppError> {
        if let Some(name) = &update.name {
            if name.trim().is_empty() {
                return Err(AppError::Validation("Tag name cannot be empty".into()));
            }
        }
        self.repo.update(id, &update)
    }

    pub fn delete_tag(&self, id: i64) -> Result<(), AppError> {
        // Clips are preserved, only the tag and its assignments are cascade deleted
        self.repo.delete(id)
    }

    pub fn assign_clip_to_tag(&self, clip_id: i64, tag_id: i64) -> Result<(), AppError> {
        self.repo.assign_clip(clip_id, tag_id)
    }

    pub fn remove_clip_from_tag(&self, clip_id: i64, tag_id: i64) -> Result<(), AppError> {
        self.repo.remove_clip(clip_id, tag_id)
    }

    pub fn get_tags_for_clip(&self, clip_id: i64) -> Result<Vec<Tag>, AppError> {
        self.repo.get_tags_for_clip(clip_id)
    }
}
