use std::path::Path;
use tracing_appender::non_blocking::WorkerGuard;
use tracing_subscriber::{EnvFilter, fmt};

pub fn init_logging(app_data_dir: &Path) -> WorkerGuard {
    let log_dir = app_data_dir.join("logs");
    std::fs::create_dir_all(&log_dir).unwrap_or_default();

    let file_appender = tracing_appender::rolling::daily(log_dir, "ornas.log");
    let (non_blocking, guard) = tracing_appender::non_blocking(file_appender);

    let format = fmt::format()
        .with_level(true)
        .with_target(true)
        .with_thread_ids(true)
        .with_thread_names(true);

    // Also log to stdout for development
    let _ = tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("ornas=info")),
        )
        .with_writer(non_blocking)
        .event_format(format)
        .try_init();

    guard
}
