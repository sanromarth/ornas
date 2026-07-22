//! Vault and encryption Tauri commands.

use crate::domain::clip::ClipUpdate;
use crate::domain::vault::{EncryptedClipPayload, VaultStatus};
use crate::error::AppError;
use crate::state::AppState;
use serde::Serialize;

#[tauri::command]
pub async fn setup_vault(
    password: String,
    state: tauri::State<'_, AppState>,
) -> Result<(), AppError> {
    state.crypto_service.setup_vault(&password)
}

#[tauri::command]
pub async fn unlock_vault(
    password: String,
    state: tauri::State<'_, AppState>,
) -> Result<(), AppError> {
    state.crypto_service.unlock_vault(&password)
}

#[tauri::command]
pub async fn lock_vault(state: tauri::State<'_, AppState>) -> Result<(), AppError> {
    state.crypto_service.lock_vault()
}

#[tauri::command]
pub async fn get_vault_status(state: tauri::State<'_, AppState>) -> Result<VaultStatus, AppError> {
    state.crypto_service.get_status()
}

#[tauri::command]
pub async fn encrypt_clip(clip_id: i64, state: tauri::State<'_, AppState>) -> Result<(), AppError> {
    let clip = state
        .clip_repo
        .get_by_id(clip_id)?
        .ok_or_else(|| AppError::Internal("Clip not found".into()))?;

    if clip.is_encrypted {
        return Ok(()); // Already encrypted
    }

    let payload = EncryptedClipPayload {
        content_text: clip.content_text,
        content_html: clip.content_html,
        content_rtf: clip.content_rtf,
        preview: clip.preview,
    };

    let (encrypted_blob, nonce) = state.crypto_service.encrypt(&payload)?;

    let update = ClipUpdate {
        is_encrypted: Some(true),
        encryption_version: Some(Some(1)),
        encrypted_blob: Some(Some(encrypted_blob)),
        nonce: Some(Some(nonce)),
        // Nullify plaintext
        content_text: Some(None),
        content_html: Some(None),
        content_rtf: Some(None),
        preview: Some(None),
        ..Default::default()
    };

    state.clip_repo.update(clip_id, &update)?;

    Ok(())
}

#[tauri::command]
pub async fn decrypt_clip(clip_id: i64, state: tauri::State<'_, AppState>) -> Result<(), AppError> {
    let clip = state
        .clip_repo
        .get_by_id(clip_id)?
        .ok_or_else(|| AppError::Internal("Clip not found".into()))?;

    if !clip.is_encrypted {
        return Ok(());
    }

    let blob = clip
        .encrypted_blob
        .as_ref()
        .ok_or_else(|| AppError::Internal("Missing blob".into()))?;
    let nonce = clip
        .nonce
        .as_ref()
        .ok_or_else(|| AppError::Internal("Missing nonce".into()))?;

    let payload = state.crypto_service.decrypt(blob, nonce)?;

    let update = ClipUpdate {
        is_encrypted: Some(false),
        encryption_version: Some(None),
        encrypted_blob: Some(None),
        nonce: Some(None),
        content_text: Some(payload.content_text),
        content_html: Some(payload.content_html),
        content_rtf: Some(payload.content_rtf),
        preview: Some(payload.preview),
        ..Default::default()
    };

    state.clip_repo.update(clip_id, &update)?;

    Ok(())
}

#[derive(Serialize)]
pub struct DecryptedPayloadResponse {
    pub content_text: Option<String>,
    pub content_html: Option<String>,
    pub content_rtf: Option<String>,
    pub preview: Option<String>,
}

#[tauri::command]
pub async fn get_decrypted_clip(
    clip_id: i64,
    state: tauri::State<'_, AppState>,
) -> Result<DecryptedPayloadResponse, AppError> {
    let clip = state
        .clip_repo
        .get_by_id(clip_id)?
        .ok_or_else(|| AppError::Internal("Clip not found".into()))?;

    if !clip.is_encrypted {
        return Ok(DecryptedPayloadResponse {
            content_text: clip.content_text,
            content_html: clip.content_html,
            content_rtf: clip.content_rtf,
            preview: clip.preview,
        });
    }

    let blob = clip
        .encrypted_blob
        .as_ref()
        .ok_or_else(|| AppError::Internal("Missing blob".into()))?;
    let nonce = clip
        .nonce
        .as_ref()
        .ok_or_else(|| AppError::Internal("Missing nonce".into()))?;

    let payload = state.crypto_service.decrypt(blob, nonce)?;

    Ok(DecryptedPayloadResponse {
        content_text: payload.content_text,
        content_html: payload.content_html,
        content_rtf: payload.content_rtf,
        preview: payload.preview,
    })
}
