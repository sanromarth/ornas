//! Crypto service — master password management and encryption logic.

use crate::domain::traits::VaultRepository;
use crate::domain::vault::{EncryptedClipPayload, VaultConfig, VaultStatus};
use crate::error::AppError;

use argon2::{Argon2, password_hash::SaltString};
use chacha20poly1305::{
    XChaCha20Poly1305, XNonce,
    aead::{Aead, KeyInit},
};
use rand::{RngCore, rngs::OsRng};
use std::sync::{Arc, RwLock};
use zeroize::{Zeroize, Zeroizing};

const VERIFICATION_PAYLOAD_STRING: &[u8] = b"ORNAS_VAULT_VERIFY";

pub struct CryptoService {
    vault_repo: Arc<dyn VaultRepository>,
    /// The master key is held only in memory and wrapped in Zeroizing.
    master_key: RwLock<Option<Zeroizing<[u8; 32]>>>,
}

impl CryptoService {
    pub fn new(vault_repo: Arc<dyn VaultRepository>) -> Self {
        Self {
            vault_repo,
            master_key: RwLock::new(None),
        }
    }

    /// Checks the initialization and lock status of the vault.
    pub fn get_status(&self) -> Result<VaultStatus, AppError> {
        let is_initialized = self.vault_repo.load_config()?.is_some();
        let is_unlocked = self.master_key.read().unwrap().is_some();
        Ok(VaultStatus {
            is_initialized,
            is_unlocked,
        })
    }

    /// Sets up the vault for the first time with a new master password.
    pub fn setup_vault(&self, password: &str) -> Result<(), AppError> {
        if self.vault_repo.load_config()?.is_some() {
            return Err(AppError::Internal("Vault already initialized".into()));
        }

        let salt = SaltString::generate(&mut OsRng);
        let key = self.derive_key(password, &salt)?;

        // Encrypt the verification payload to store in DB
        let cipher = XChaCha20Poly1305::new_from_slice(key.as_slice())
            .map_err(|_| AppError::Internal("Invalid key length".into()))?;

        let mut nonce_bytes = [0u8; 24];
        OsRng.fill_bytes(&mut nonce_bytes);
        let nonce = XNonce::try_from(&nonce_bytes[..])
            .map_err(|_| AppError::Internal("Invalid nonce size".into()))?;

        let encrypted_payload = cipher
            .encrypt(&nonce, VERIFICATION_PAYLOAD_STRING)
            .map_err(|_| AppError::Internal("Encryption failed".into()))?;

        let config = VaultConfig {
            id: 1,
            salt: salt.as_str().as_bytes().to_vec(),
            verification_nonce: nonce_bytes.to_vec(),
            verification_payload: encrypted_payload,
            created_at: 0,
            updated_at: 0,
        };

        self.vault_repo.save_config(&config)?;

        // Lock it immediately (or we could store it in master_key to auto-unlock)
        *self.master_key.write().unwrap() = Some(key);
        Ok(())
    }

    /// Unlocks the vault by deriving the key and checking the verification payload.
    pub fn unlock_vault(&self, password: &str) -> Result<(), AppError> {
        let config = self
            .vault_repo
            .load_config()?
            .ok_or_else(|| AppError::Internal("Vault not initialized".into()))?;

        let salt = SaltString::from_b64(
            std::str::from_utf8(&config.salt)
                .map_err(|_| AppError::Internal("Invalid salt encoding".into()))?,
        )
        .map_err(|_| AppError::Internal("Invalid salt string".into()))?;

        let key = self.derive_key(password, &salt)?;

        let cipher = XChaCha20Poly1305::new_from_slice(key.as_slice())
            .map_err(|_| AppError::Internal("Invalid key length".into()))?;

        let nonce = XNonce::try_from(&config.verification_nonce[..])
            .map_err(|_| AppError::Internal("Invalid nonce size".into()))?;

        // Try to decrypt the verification payload
        let decrypted = cipher
            .decrypt(&nonce, config.verification_payload.as_ref())
            .map_err(|_| AppError::Internal("Invalid password".into()))?;

        if decrypted != VERIFICATION_PAYLOAD_STRING {
            return Err(AppError::Internal("Invalid password".into()));
        }

        *self.master_key.write().unwrap() = Some(key);
        Ok(())
    }

    /// Locks the vault, zeroizing the master key from memory.
    pub fn lock_vault(&self) -> Result<(), AppError> {
        let mut key_guard = self.master_key.write().unwrap();
        if let Some(mut key) = key_guard.take() {
            key.zeroize();
        }
        Ok(())
    }

    /// Encrypts a clip payload using XChaCha20-Poly1305.
    pub fn encrypt(&self, payload: &EncryptedClipPayload) -> Result<(Vec<u8>, Vec<u8>), AppError> {
        let key_guard = self.master_key.read().unwrap();
        let key = key_guard
            .as_ref()
            .ok_or_else(|| AppError::Internal("Vault is locked".into()))?;

        let cipher = XChaCha20Poly1305::new_from_slice(key.as_slice())
            .map_err(|_| AppError::Internal("Invalid key length".into()))?;

        let mut nonce_bytes = [0u8; 24];
        OsRng.fill_bytes(&mut nonce_bytes);
        let nonce = XNonce::try_from(&nonce_bytes[..])
            .map_err(|_| AppError::Internal("Invalid nonce size".into()))?;

        let json = serde_json::to_vec(payload)
            .map_err(|e| AppError::Internal(format!("Serialization failed: {e}")))?;

        let encrypted = cipher
            .encrypt(&nonce, json.as_ref())
            .map_err(|_| AppError::Internal("Encryption failed".into()))?;

        Ok((encrypted, nonce_bytes.to_vec()))
    }

    /// Decrypts a clip payload back to its struct.
    pub fn decrypt(
        &self,
        encrypted_blob: &[u8],
        nonce: &[u8],
    ) -> Result<EncryptedClipPayload, AppError> {
        let key_guard = self.master_key.read().unwrap();
        let key = key_guard
            .as_ref()
            .ok_or_else(|| AppError::Internal("Vault is locked".into()))?;

        let cipher = XChaCha20Poly1305::new_from_slice(key.as_slice())
            .map_err(|_| AppError::Internal("Invalid key length".into()))?;

        let nonce =
            XNonce::try_from(nonce).map_err(|_| AppError::Internal("Invalid nonce size".into()))?;

        let decrypted = cipher
            .decrypt(&nonce, encrypted_blob)
            .map_err(|_| AppError::Internal("Decryption failed".into()))?;

        let payload = serde_json::from_slice(&decrypted)
            .map_err(|e| AppError::Internal(format!("Deserialization failed: {e}")))?;

        Ok(payload)
    }

    /// Derives a 32-byte key using Argon2id.
    fn derive_key(
        &self,
        password: &str,
        salt: &SaltString,
    ) -> Result<Zeroizing<[u8; 32]>, AppError> {
        let argon2 = Argon2::default();
        let mut key_bytes = [0u8; 32];

        argon2
            .hash_password_into(
                password.as_bytes(),
                salt.as_str().as_bytes(),
                &mut key_bytes,
            )
            .map_err(|e| AppError::Internal(format!("Key derivation failed: {e}")))?;

        Ok(Zeroizing::new(key_bytes))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::infrastructure::database::vault_repo::SqliteVaultRepository;
    use crate::infrastructure::database::{
        Database, connection::open_in_memory, migrations::run_migrations,
    };

    fn setup_test_service() -> CryptoService {
        let mut conn = open_in_memory().unwrap();
        run_migrations(&mut conn).unwrap();
        let db = Arc::new(Database::new(conn));
        let repo = Arc::new(SqliteVaultRepository::new(db));
        CryptoService::new(repo)
    }

    #[test]
    fn test_vault_setup_and_status() {
        let service = setup_test_service();

        // Initial state
        let status = service.get_status().unwrap();
        assert!(!status.is_initialized);
        assert!(!status.is_unlocked);

        // Setup vault
        service.setup_vault("my_secure_password").unwrap();

        // Status after setup (should be initialized and auto-unlocked)
        let status = service.get_status().unwrap();
        assert!(status.is_initialized);
        assert!(status.is_unlocked);

        // Try setting up again (should fail)
        let err = service.setup_vault("another_password");
        assert!(err.is_err());
    }

    #[test]
    fn test_vault_lock_and_unlock() {
        let service = setup_test_service();
        service.setup_vault("my_secure_password").unwrap();

        // Lock vault
        service.lock_vault().unwrap();
        let status = service.get_status().unwrap();
        assert!(status.is_initialized);
        assert!(!status.is_unlocked);

        // Unlock with wrong password
        let err = service.unlock_vault("wrong_password");
        assert!(err.is_err());
        assert!(!service.get_status().unwrap().is_unlocked);

        // Unlock with correct password
        service.unlock_vault("my_secure_password").unwrap();
        assert!(service.get_status().unwrap().is_unlocked);
    }

    #[test]
    fn test_vault_encryption_roundtrip() {
        let service = setup_test_service();
        service.setup_vault("password123").unwrap();

        let payload = EncryptedClipPayload {
            content_text: Some("Super secret string".into()),
            content_html: None,
            content_rtf: None,
            preview: None,
        };

        // Encrypt
        let (encrypted_blob, nonce) = service.encrypt(&payload).unwrap();
        assert!(!encrypted_blob.is_empty());

        // Decrypt
        let decrypted = service.decrypt(&encrypted_blob, &nonce).unwrap();
        assert_eq!(decrypted.content_text.unwrap(), "Super secret string");
    }

    #[test]
    fn test_vault_encryption_fails_when_locked() {
        let service = setup_test_service();
        service.setup_vault("password123").unwrap();
        service.lock_vault().unwrap();

        let payload = EncryptedClipPayload {
            content_text: Some("Secret".into()),
            content_html: None,
            content_rtf: None,
            preview: None,
        };

        let err = service.encrypt(&payload);
        assert!(err.is_err()); // Vault is locked
    }
}
