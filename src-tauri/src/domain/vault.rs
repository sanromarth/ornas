//! Vault domain models — representing encrypted storage configuration.
//!
//! Handles the master password verification payload and salt.

use serde::{Deserialize, Serialize};

/// Configuration for the encrypted vault stored in the database.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultConfig {
    pub id: i64,
    pub salt: Vec<u8>,
    pub verification_nonce: Vec<u8>,
    pub verification_payload: Vec<u8>,
    pub created_at: i64,
    pub updated_at: i64,
}

/// The vault status returned to the frontend.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultStatus {
    pub is_initialized: bool,
    pub is_unlocked: bool,
}

/// A serialized version of a clip's sensitive data for encryption.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptedClipPayload {
    pub content_text: Option<String>,
    pub content_html: Option<String>,
    pub content_rtf: Option<String>,
    pub preview: Option<String>,
}
