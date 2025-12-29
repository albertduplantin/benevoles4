/**
 * Génération de tokens sécurisés pour l'accès email-only
 */

/**
 * Génère un token aléatoire sécurisé
 * Format: 32 caractères alphanumériques
 */
export function generatePersonalToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = 32;
  let token = '';
  
  // Utiliser crypto si disponible (plus sécurisé)
  if (typeof window !== 'undefined' && window.crypto) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      token += chars[array[i] % chars.length];
    }
  } else {
    // Fallback pour Node.js (serveur)
    const crypto = require('crypto');
    const bytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      token += chars[bytes[i] % chars.length];
    }
  }
  
  return token;
}

/**
 * Vérifie si un token est valide (format uniquement)
 */
export function isValidTokenFormat(token: string): boolean {
  return /^[A-Za-z0-9]{32}$/.test(token);
}


















