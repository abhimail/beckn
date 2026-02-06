// Beckn CDS API Client
// Handles Discover (GET) and Publish (POST) requests

import { signRequest, getCurrentKey } from './signing.js';

// Use proxy server to bypass CORS
const USE_PROXY = true;
const PROXY_URL = 'http://localhost:3100';
const CDS_BASE_URL = USE_PROXY ? PROXY_URL : 'https://34.93.141.21.sslip.io';

// Extract host from URL
const getHost = (url) => {
  try {
    return new URL(url).host;
  } catch {
    return 'localhost:3100';
  }
};

// Generate unique IDs for Beckn context
const generateId = () => crypto.randomUUID();

// Build Beckn context for requests
const buildContext = (action, role) => ({
  version: '2.0.0',
  action,
  timestamp: new Date().toISOString(),
  message_id: generateId(),
  transaction_id: generateId(),
  ttl: 'PT30S',
  ...(action === 'discover'
    ? {
        bap_id: 'sandbox-retail-np1.com',
        bap_uri: 'https://demo.app/callbacks',
        schema_context: role === 'provider'
          ? ["https://example.org/schema/driver/v1/context.jsonld"]
          : role === 'driver'
            ? ["https://example.org/schema/driver-job/v1/context.jsonld"]
            : [
                "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/driver/v1/context.jsonld",
                "https://example.org/schema/driver/v1/context.jsonld",
                "https://example.org/schema/driver-job/v1/context.jsonld"
              ]
      }
    : {
        bpp_id: 'sandbox-retail-np2.com',
        bpp_uri: 'https://provider.demo.app/callbacks'
      })
});


/**
 * Discover API - Search for items
 * @param {Object} params - Search parameters
 * @param {string} params.textSearch - NLP text search query
 * @param {Object} params.jsonPathFilter - JSONPath filter object
 * @param {Object} params.geoFilter - Geo filter {lat, lon, radiusKm}
 * @param {string} params.apiKey - CDS API key
 * @param {string} params.role - 'driver' or 'provider'
 * @returns {Promise<Object>} - Discovery response
 */
export async function discoverItems({ textSearch, jsonPathFilter, geoFilter, apiKey, role }) {
  const context = buildContext('discover', role);
  
  // Build message object based on what's provided
  const message = {};
  
  // NLP text search
  if (textSearch && textSearch.trim()) {
    message.text_search = textSearch.trim();
  }
  
  // JSONPath filter
  if (jsonPathFilter && jsonPathFilter.expression && jsonPathFilter.expression.trim()) {
    message.filters = {
      type: 'jsonpath',
      expression: jsonPathFilter.expression.trim()
    };
  }
  
  // Geo/spatial filter
  if (geoFilter && geoFilter.lat && geoFilter.lon && geoFilter.radiusKm) {
    // Determine target path based on role
    const targetPath = role === 'driver' 
      ? "$['beckn:itemAttributes']['job:jobLocation']['geo']"
      : "$['beckn:itemAttributes']['driver:homeLocation']['geo']";
    
    message.spatial = [{
      op: 's_dwithin',
      targets: targetPath,
      geometry: {
        type: 'Point',
        coordinates: [parseFloat(geoFilter.lon), parseFloat(geoFilter.lat)]
      },
      distanceMeters: parseFloat(geoFilter.radiusKm) * 1000
    }];
  }
  
  const requestBody = { context, message };
  
  try {
    // Note: beckn.yaml shows GET with body, which is non-standard
    // Most HTTP clients support it, but some proxies may strip the body
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Add API key only if provided (fallback for backward compatibility)
    if (apiKey) {
      headers['x-api-key'] = apiKey;
    }
    
    // Sign request if signing key is loaded
    const currentKey = getCurrentKey();
    if (currentKey) {
      try {
        const signingHeaders = signRequest({
          method: 'POST',
          path: '/beckn/discover',
          host: getHost(CDS_BASE_URL),
          body: requestBody
        });
        
        // Add signing headers (Digest and Authorization)
        Object.assign(headers, signingHeaders);
        
        console.log('[CDS Client] Request signed with key (xed25519):', currentKey.keyId);
      } catch (signError) {
        console.warn('[CDS Client] Signing failed:', signError.message);
        throw new Error(`Failed to sign request: ${signError.message}`);
      }
    } else {
      console.warn('[CDS Client] No signing key loaded - sending unsigned request');
    }
    
    const response = await fetch(`${CDS_BASE_URL}/beckn/discover`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`CDS returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Define context constants
    const DRIVER_CTX = "https://example.org/schema/driver/v1/context.jsonld";
    const DRIVER_JOB_CTX = "https://example.org/schema/driver-job/v1/context.jsonld";
    const BASE_CTX = "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/driver/v1/context.jsonld";
    
    // Filter out items with non-allowed @context values based on role
    let allowedContexts;
    if (role === 'provider') {
      // Provider role: only allow driver context
      allowedContexts = new Set([BASE_CTX, DRIVER_CTX]);
    } else if (role === 'driver') {
      // Driver role: only allow driver-job context
      allowedContexts = new Set([DRIVER_JOB_CTX]);
    } else {
      // No role or other: allow all contexts for backward compatibility
      allowedContexts = new Set([BASE_CTX, DRIVER_CTX, DRIVER_JOB_CTX]);
    }

    const itemHasAllowedContext = (item) => {
      const ctx = item?.['beckn:itemAttributes']?.['@context'];
      if (!ctx) return false;
      if (Array.isArray(ctx)) return ctx.some(c => allowedContexts.has(c));
      return allowedContexts.has(ctx);
    };

    const filterItemsArray = (items) => (Array.isArray(items) ? items.filter(itemHasAllowedContext) : items);

    // Deep clone to avoid mutating original response
    const filteredData = JSON.parse(JSON.stringify(data));

    // Filter catalogs with 'beckn:items' arrays
    if (filteredData?.message?.catalogs && Array.isArray(filteredData.message.catalogs)) {
      filteredData.message.catalogs = filteredData.message.catalogs
        .map(catalog => ({
          ...catalog,
          'beckn:items': filterItemsArray(catalog['beckn:items'])
        }))
        .filter(catalog => Array.isArray(catalog['beckn:items']) ? catalog['beckn:items'].length > 0 : true);
    }

    // Filter message.items if present
    if (filteredData?.message?.items) {
      filteredData.message.items = filterItemsArray(filteredData.message.items);
    }

    // Filter message.results if present
    if (filteredData?.message?.results && Array.isArray(filteredData.message.results)) {
      filteredData.message.results = filteredData.message.results.map(r => {
        if (r && r['beckn:items']) {
          return { ...r, 'beckn:items': filterItemsArray(r['beckn:items']) };
        }
        return r;
      }).filter(r => !(Array.isArray(r['beckn:items']) && r['beckn:items'].length === 0));
    }

    // Handle top-level array of items
    if (Array.isArray(filteredData)) {
      const topArray = filterItemsArray(filteredData);
      return { success: true, data: topArray, requestBody };
    }

    return { success: true, data: filteredData, requestBody };
  } catch (error) {
    console.error('Discover API error:', error);
    return { success: false, error: error.message, requestBody };
  }
}

/**
 * Publish catalogues to CDS
 * @param {Array} catalogues - Array of Beckn catalogue objects
 * @param {string} apiKey - CDS API key
 * @returns {Promise<Object>} - Publish response
 */
export async function publishCatalogues(catalogues, apiKey) {
  const context = buildContext('catalog_publish');
  
  const requestBody = {
    context,
    message: {
      catalogs: catalogues
    }
  };
  
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Add API key only if provided (fallback for backward compatibility)
    if (apiKey) {
      headers['x-api-key'] = apiKey;
    }
    
    // Sign request if signing key is loaded
    const currentKey = getCurrentKey();
    if (currentKey) {
      try {
        const signingHeaders = signRequest({
          method: 'POST',
          path: '/beckn/v2/catalog/publish',
          host: getHost(CDS_BASE_URL),
          body: requestBody
        });
        
        // Add signing headers
        Object.assign(headers, signingHeaders);
        
        console.log('[CDS Client] Publish request signed with key:', currentKey.keyId);
      } catch (signError) {
        console.warn('[CDS Client] Signing failed:', signError.message);
        throw new Error(`Failed to sign request: ${signError.message}`);
      }
    } else {
      console.warn('[CDS Client] No signing key loaded - sending unsigned request');
    }
    
    const response = await fetch(`${CDS_BASE_URL}/beckn/v2/catalog/publish`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`CDS returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return { success: true, data, requestBody };
  } catch (error) {
    console.error('Publish API error:', error);
    return { success: false, error: error.message, requestBody };
  }
}
