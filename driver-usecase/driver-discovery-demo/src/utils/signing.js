// BECKN HTTP Signature Module
// Implements BECKN-006 signing specification with BLAKE2b-512 and Ed25519

import nacl from 'tweetnacl';
import { blake2b } from 'blakejs';

// In-memory storage for signing keys (session only)
let signingKeys = {};
let currentKeyId = null;

/**
 * Load a signing key from JSON
 * @param {Object} keyData - { subscriberId, keyId, privateKey (base64) }
 * @returns {boolean} - success
 */
export function loadSigningKey(keyData) {
  try {
    const { subscriberId, keyId, privateKey } = keyData;
    
    if (!subscriberId || !keyId || !privateKey) {
      throw new Error('Missing required fields: subscriberId, keyId, privateKey');
    }
    
    // Decode base64 private key (should be 32 bytes for ed25519)
    const privateKeyBytes = base64ToUint8Array(privateKey);
    
    if (privateKeyBytes.length !== 32) {
      throw new Error('Private key must be 32 bytes (ed25519)');
    }
    
    // Store key
    signingKeys[keyId] = {
      subscriberId,
      keyId,
      privateKeyBytes,
      algorithm: 'ed25519'
    };
    
    // Set as current key
    currentKeyId = keyId;
    
    console.log(`[Signing] Loaded key: ${keyId} for subscriber: ${subscriberId}`);
    return true;
  } catch (error) {
    console.error('[Signing] Failed to load key:', error);
    return false;
  }
}

/**
 * Get list of loaded key IDs
 * @returns {Array} - Array of { keyId, subscriberId }
 */
export function getLoadedKeys() {
  return Object.values(signingKeys).map(k => ({
    keyId: k.keyId,
    subscriberId: k.subscriberId
  }));
}

/**
 * Set the current signing key to use
 * @param {string} keyId - Key ID to use
 * @returns {boolean} - success
 */
export function setCurrentKey(keyId) {
  if (signingKeys[keyId]) {
    currentKeyId = keyId;
    console.log(`[Signing] Switched to key: ${keyId}`);
    return true;
  }
  console.error(`[Signing] Key not found: ${keyId}`);
  return false;
}

/**
 * Get current signing key info
 * @returns {Object|null} - { keyId, subscriberId } or null
 */
export function getCurrentKey() {
  if (currentKeyId && signingKeys[currentKeyId]) {
    const key = signingKeys[currentKeyId];
    return {
      keyId: key.keyId,
      subscriberId: key.subscriberId
    };
  }
  return null;
}

/**
 * Clear all loaded keys
 */
export function clearKeys() {
  signingKeys = {};
  currentKeyId = null;
  console.log('[Signing] All keys cleared');
}

/**
 * Compute BLAKE2b-512 digest of request body
 * @param {string} body - JSON body as string
 * @returns {string} - Base64 digest
 */
export function computeDigest(body) {
  const bodyBytes = new TextEncoder().encode(body);
  const hash = blake2b(bodyBytes, null, 64); // 64 bytes = 512 bits
  return uint8ArrayToBase64(hash);
}

/**
 * Build signing string according to BECKN spec
 * @param {Object} params
 * @param {string} params.method - HTTP method (POST, GET, etc.)
 * @param {string} params.path - Request path (e.g., /beckn/discover)
 * @param {string} params.host - Host header value
 * @param {string} params.date - Date header value (RFC 2616)
 * @param {string} params.digest - Digest header value (BLAKE-512=...)
 * @param {string} params.contentType - Content-Type header value
 * @param {Array} params.headers - Optional: custom header list to include
 * @returns {string} - Signing string
 */
export function buildSigningString(params) {
  const {
    method = 'POST',
    path,
    host,
    date,
    digest,
    contentType = 'application/json',
    headers = ['(request-target)', 'host', 'date', 'digest', 'content-type']
  } = params;
  
  const requestTarget = `${method.toLowerCase()} ${path}`;
  
  const headerMap = {
    '(request-target)': requestTarget,
    'host': host,
    'date': date,
    'digest': digest,
    'content-type': contentType
  };
  
  const lines = headers.map(h => {
    const value = headerMap[h.toLowerCase()];
    if (value === undefined) {
      throw new Error(`Missing value for header: ${h}`);
    }
    return `${h.toLowerCase()}: ${value}`;
  });
  
  return lines.join('\n');
}

/**
 * Sign a string using current ed25519 key
 * @param {string} signingString - String to sign
 * @returns {string} - Base64 signature
 */
export function signString(signingString) {
  if (!currentKeyId || !signingKeys[currentKeyId]) {
    throw new Error('No signing key loaded');
  }
  
  const key = signingKeys[currentKeyId];
  const messageBytes = new TextEncoder().encode(signingString);
  
  // Create keypair from private key (tweetnacl requires 32-byte seed)
  const keyPair = nacl.sign.keyPair.fromSeed(key.privateKeyBytes);
  
  // Sign the message
  const signature = nacl.sign.detached(messageBytes, keyPair.secretKey);
  
  return uint8ArrayToBase64(signature);
}

/**
 * Build Authorization header in Signature format
 * @param {Object} params
 * @param {string} params.keyId - Key ID
 * @param {string} params.algorithm - Algorithm (e.g., ed25519)
 * @param {Array} params.headers - List of headers included in signature
 * @param {string} params.signature - Base64 signature
 * @returns {string} - Authorization header value
 */
export function buildAuthorizationHeader({ keyId, algorithm, headers, signature }) {
  const headersList = headers.join(' ');
  return `Signature keyId="${keyId}",algorithm="${algorithm}",headers="${headersList}",signature="${signature}"`;
}

/**
 * Sign an HTTP request and return headers (Server-compliant xed25519 format)
 * @param {Object} params
 * @param {string} params.method - HTTP method
 * @param {string} params.path - Request path
 * @param {string} params.host - Host
 * @param {Object} params.body - Request body (will be JSON stringified)
 * @returns {Object} - Headers to add to request { Digest, Authorization }
 */
export function signRequest({ method, path, host, body }) {
  if (!currentKeyId || !signingKeys[currentKeyId]) {
    throw new Error('No signing key loaded. Please upload a signing key first.');
  }
  
  const key = signingKeys[currentKeyId];
  
  // Compute created and expires (unix timestamp in seconds)
  const created = Math.floor(Date.now() / 1000);
  const expires = created + 600; // 600 seconds = 10 minutes
  
  // Stringify body
  const bodyString = JSON.stringify(body);
  
  // Compute Digest: BLAKE-512=<base64>
  const digestBase64 = computeDigest(bodyString);
  const digest = `BLAKE-512=${digestBase64}`;
  
  // Build signing string exactly as server expects:
  // (created): <created>
  // (expires): <expires>
  // digest: BLAKE-512=<base64>
  const signingString = `(created): ${created}\n(expires): ${expires}\ndigest: ${digest}`;
  
  // Compute pre-hash: BLAKE2b-512(signingString)
  const signingStringBytes = new TextEncoder().encode(signingString);
  const prehash = blake2b(signingStringBytes, null, 64); // 64 bytes = 512 bits
  
  // Sign the pre-hash with Ed25519 (xed25519)
  const keyPair = nacl.sign.keyPair.fromSeed(key.privateKeyBytes);
  const signature = nacl.sign.detached(signingStringBytes, keyPair.secretKey);
  const signatureBase64 = uint8ArrayToBase64(signature);
  
  // Build composite keyId: subscriberId|keyId|xed25519
  const compositeKeyId = `${key.subscriberId}|${key.keyId}|xed25519`;
  
  // Build Authorization header in server-required format
  const authorization = `Signature keyId="${compositeKeyId}" algorithm="xed25519" created="${created}" expires="${expires}" headers="(created) (expires) digest" signature="${signatureBase64}"`;
  
  console.log('[Signing] Signed request (xed25519):', {
    subscriberId: key.subscriberId,
    keyId: key.keyId,
    compositeKeyId,
    created,
    expires,
    digest: digest.substring(0, 50) + '...',
    signingString: signingString.substring(0, 100) + '...',
    prehashBase64: uint8ArrayToBase64(prehash).substring(0, 50) + '...',
    signatureBase64: signatureBase64.substring(0, 50) + '...'
  });
  
  return {
    'Digest': digest,
    'Authorization': authorization
  };
}

// Utility functions
function base64ToUint8Array(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64(bytes) {
  const binaryString = Array.from(bytes)
    .map(byte => String.fromCharCode(byte))
    .join('');
  return btoa(binaryString);
}
