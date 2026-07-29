use crate::error::AppError;
use crate::infrastructure::database::Database;
use std::sync::Arc;

pub struct MaintenanceService {
    db: Arc<Database>,
}

impl MaintenanceService {
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }

    /// Run scheduled maintenance (WAL checkpoint, VACUUM, optimize)
    pub fn run_maintenance(&self) -> Result<(), AppError> {
        let conn = self.db.conn()?;

        tracing::info!("Starting database maintenance");

        // 1. Optimize queries
        if let Err(e) = conn.execute_batch("PRAGMA optimize;") {
            tracing::warn!("PRAGMA optimize failed: {}", e);
        }

        // 2. Truncate WAL to keep file size down
        if let Err(e) = conn.execute_batch("PRAGMA wal_checkpoint(TRUNCATE);") {
            tracing::warn!("WAL checkpoint failed: {}", e);
        }

        // 3. Optional: VACUUM if fragmentation is high or size is large
        // For now, we simply run VACUUM if page_count * page_size > threshold and free pages > threshold.
        // Let's get freespace.
        let page_count: i64 = conn
            .query_row("PRAGMA page_count;", [], |row| row.get(0))
            .unwrap_or(0);
        let freelist_count: i64 = conn
            .query_row("PRAGMA freelist_count;", [], |row| row.get(0))
            .unwrap_or(0);

        // If more than 20% of pages are free and we have at least 1000 free pages (approx 4MB if 4k pages), vacuum.
        if page_count > 0
            && freelist_count > 1000
            && (freelist_count as f64 / page_count as f64) > 0.20
        {
            tracing::info!(
                freelist_count = freelist_count,
                "Running VACUUM to reclaim space"
            );
            if let Err(e) = conn.execute_batch("VACUUM;") {
                tracing::warn!("VACUUM failed: {}", e);
            }
        }

        tracing::info!("Database maintenance complete");
        Ok(())
    }
}
