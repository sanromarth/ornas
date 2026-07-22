//! Collection service — business logic for managing collections.

use crate::domain::collection::{Collection, CollectionUpdate, NewCollection};
use crate::domain::traits::CollectionRepository;
use crate::error::AppError;
use std::sync::Arc;

pub struct CollectionService {
    repo: Arc<dyn CollectionRepository>,
}

impl CollectionService {
    pub fn new(repo: Arc<dyn CollectionRepository>) -> Self {
        Self { repo }
    }

    pub fn create_collection(&self, name: String, icon: Option<String>, color: Option<String>) -> Result<Collection, AppError> {
        if name.trim().is_empty() {
            return Err(AppError::Validation("Collection name cannot be empty".into()));
        }
        
        let new_collection = NewCollection { name, icon, color };
        self.repo.create(&new_collection)
    }

    pub fn get_collection(&self, id: i64) -> Result<Collection, AppError> {
        self.repo
            .get_by_id(id)?
            .ok_or_else(|| AppError::NotFound(format!("Collection {id} not found")))
    }

    pub fn list_collections(&self) -> Result<Vec<Collection>, AppError> {
        self.repo.list()
    }

    pub fn update_collection(&self, id: i64, update: CollectionUpdate) -> Result<Collection, AppError> {
        if let Some(name) = &update.name {
            if name.trim().is_empty() {
                return Err(AppError::Validation("Collection name cannot be empty".into()));
            }
        }
        self.repo.update(id, &update)
    }

    pub fn delete_collection(&self, id: i64) -> Result<(), AppError> {
        // Clips are preserved, only the collection and its assignments are cascade deleted
        self.repo.delete(id)
    }

    pub fn assign_clip_to_collection(&self, clip_id: i64, collection_id: i64) -> Result<(), AppError> {
        self.repo.assign_clip(clip_id, collection_id)
    }

    pub fn remove_clip_from_collection(&self, clip_id: i64, collection_id: i64) -> Result<(), AppError> {
        self.repo.remove_clip(clip_id, collection_id)
    }

    pub fn get_collections_for_clip(&self, clip_id: i64) -> Result<Vec<Collection>, AppError> {
        self.repo.get_collections_for_clip(clip_id)
    }
}
