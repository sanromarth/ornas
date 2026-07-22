//! Application state — holds all services, repositories, and configuration.
//!
//! `AppState` is constructed once at startup and passed to Tauri
//! via `.manage()`. All command handlers receive it via dependency injection.
//! Services access repository implementations through trait objects.

use crate::domain::config::AppConfig;
use crate::domain::traits::{ClipRepository, SearchRepository, SettingsRepository};
use crate::error::AppError;
use crate::infrastructure::database::Database;
use crate::infrastructure::database::clip_repo::SqliteClipRepo;
use crate::infrastructure::database::connection;
use crate::infrastructure::database::migrations;
use crate::infrastructure::database::search_repo::SqliteSearchRepo;
use crate::infrastructure::database::settings_repo::SqliteSettingsRepo;
use crate::infrastructure::image_store::ImageStore;
use crate::infrastructure::pipeline::runner::PipelineRunner;
use crate::services::clipboard_service::ClipboardService;
use crate::services::search_service::SearchService;
use crate::services::settings_service::SettingsService;
use std::path::PathBuf;
use std::sync::Arc;

/// Shared application state managed by Tauri.
///
/// All fields are thread-safe (`Send + Sync`) because Tauri
/// commands may execute on any thread.
pub struct AppState {
    /// Central application configuration.
    pub config: AppConfig,
    /// Clipboard CRUD service.
    pub clipboard_service: ClipboardService,
    /// Search service (FTS5).
    pub search_service: SearchService,
    /// Settings service (key-value config).
    pub settings_service: SettingsService,
    /// Collection service.
    pub collection_service: crate::services::collection_service::CollectionService,
    /// Tag service.
    pub tag_service: crate::services::tag_service::TagService,
    /// Clip repository (for direct pipeline access).
    pub clip_repo: Arc<dyn ClipRepository>,
    /// Image store.
    #[allow(dead_code)]
    pub image_store: Arc<ImageStore>,
    /// Pipeline runner.
    pub pipeline: Arc<PipelineRunner>,
    /// Database connection.
    pub db: Arc<Database>,
}

impl AppState {
    /// Creates a new `AppState` by initializing all infrastructure.
    ///
    /// Startup sequence (per ARCHITECTURE_FINAL.md §11):
    /// 1. Resolve data directory
    /// 2. Open SQLite database
    /// 3. Apply PRAGMA settings
    /// 4. Run migrations
    /// 5. Load user settings
    /// 6. Build repositories
    /// 7. Build services
    /// 8. Build pipeline
    pub fn new(app_handle: tauri::AppHandle) -> Result<Self, AppError> {
        // 1-3. Open database
        let db_path = connection::database_path()?;
        tracing::info!(path = %db_path.display(), "Opening database");
        let mut conn = connection::open_database(&db_path)?;

        // 4. Run migrations
        migrations::run_migrations(&mut conn)?;
        tracing::info!("Migrations applied");

        // 5. Build Database wrapper
        let db = Arc::new(Database::new(conn));

        // 6. Build repositories
        let clip_repo: Arc<dyn ClipRepository> = Arc::new(SqliteClipRepo::new(Arc::clone(&db)));
        let search_repo: Arc<dyn SearchRepository> =
            Arc::new(SqliteSearchRepo::new(Arc::clone(&db)));
        let settings_repo: Arc<dyn SettingsRepository> =
            Arc::new(SqliteSettingsRepo::new(Arc::clone(&db)));
        let collection_repo: Arc<dyn crate::domain::traits::CollectionRepository> =
            Arc::new(crate::infrastructure::database::collection_repo::SqliteCollectionRepo::new(Arc::clone(&db)));
        let tag_repo: Arc<dyn crate::domain::traits::TagRepository> =
            Arc::new(crate::infrastructure::database::tag_repo::SqliteTagRepo::new(Arc::clone(&db)));

        // 7. Load config from settings
        let settings_service = SettingsService::new(Arc::clone(&settings_repo));
        let config = settings_service.load_config()?;
        tracing::info!("Configuration loaded");

        // 8. Build image store
        let images_dir = db_path
            .parent()
            .map(|p| p.join("images"))
            .unwrap_or_else(|| PathBuf::from("images"));
        let image_store = Arc::new(ImageStore::new(images_dir)?);

        // 9. Build pipeline stages
        let pipeline = Self::build_pipeline(
            &config,
            Arc::clone(&clip_repo),
            Arc::clone(&image_store),
            app_handle.clone(),
        );
        let pipeline = Arc::new(pipeline);

        // 10. Build services
        let clipboard_service =
            ClipboardService::new(Arc::clone(&clip_repo), config.clone(), app_handle);
        let search_service = SearchService::new(Arc::clone(&search_repo));
        let collection_service = crate::services::collection_service::CollectionService::new(collection_repo);
        let tag_service = crate::services::tag_service::TagService::new(tag_repo);

        tracing::info!("Application state initialized");

        Ok(Self {
            config,
            clipboard_service,
            search_service,
            settings_service,
            collection_service,
            tag_service,
            clip_repo,
            image_store,
            pipeline,
            db,
        })
    }

    /// Builds the 7-stage clipboard processing pipeline.
    fn build_pipeline(
        config: &AppConfig,
        clip_repo: Arc<dyn ClipRepository>,
        image_store: Arc<ImageStore>,
        app_handle: tauri::AppHandle,
    ) -> PipelineRunner {
        use crate::infrastructure::pipeline::{
            categorizer::Categorizer, code_detector::CodeDetector, dedup::Dedup, hasher::Hasher, metadata::Metadata,
            normalizer::Normalizer, notifier::Notifier, persister::Persister,
        };

        let stages: Vec<Box<dyn crate::domain::pipeline::PipelineStage>> = vec![
            Box::new(Normalizer),
            Box::new(CodeDetector::new()),
            Box::new(Hasher),
            Box::new(Dedup::new(config.dedup_cache_size, Arc::clone(&clip_repo))),
            Box::new(Categorizer),
            Box::new(Metadata),
            Box::new(Persister::new(Arc::clone(&clip_repo), image_store)),
            Box::new(Notifier::new(app_handle)),
        ];

        PipelineRunner::new(stages)
    }
}
