use anyhow::Result;
use base64::{Engine, engine::general_purpose};
use chacha20poly1305::{
    ChaCha20Poly1305,
    aead::{Aead, AeadCore, KeyInit, OsRng},
};
use sha2::digest::generic_array::GenericArray;

use crate::config::Config;

/// Encrypt a string
///
/// * `s`: the string to encrypt
///
/// # Return
///
/// A tuple, the first element is base64 encoded `s` encrypted. Second is *base64 encoded* nounce. The nounce must be used to decode the string
pub fn encrypt(s: &str) -> Result<(String, String), chacha20poly1305::Error> {
    let config = Config::load();
    let key = GenericArray::from_slice(config.encryption_key.as_bytes());
    let cipher = ChaCha20Poly1305::new(key);
    let nonce = ChaCha20Poly1305::generate_nonce(&mut OsRng); // 96-bits; unique per message
    let ciphertext = cipher.encrypt(&nonce, s.as_bytes())?;
    let b64_text = general_purpose::STANDARD.encode(ciphertext);
    let b64_nounce = general_purpose::STANDARD.encode(nonce);
    Ok((b64_text, b64_nounce))
}

/// Decrypt a base64 encoded string
///
/// * `s`: the string to decrypt
/// * `nounce`: the base64 encoded nounce used to encrypt `s`
pub fn decrypt(s: &str, nounce: &str) -> Result<String, chacha20poly1305::Error> {
    let config = Config::load();
    let key = GenericArray::from_slice(config.encryption_key.as_bytes());
    let cipher = ChaCha20Poly1305::new(key);
    let decoded_nounce = general_purpose::STANDARD
        .decode(nounce)
        .expect("Failed to decode nounce as base64 string");

    let nonce = GenericArray::from_slice(&decoded_nounce[..12]);
    let decoded_b64 = general_purpose::STANDARD
        .decode(s)
        .expect("Failed to decode as base64 string");
    let plaintext = cipher.decrypt(nonce, decoded_b64.as_ref())?;

    Ok(String::from_utf8(plaintext).unwrap())
}
