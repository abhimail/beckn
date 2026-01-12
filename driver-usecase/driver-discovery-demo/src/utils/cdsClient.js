// Beckn CDS API Client
// Handles Discover (GET) and Publish (POST) requests

// Use proxy server to bypass CORS
const USE_PROXY = true;
const PROXY_URL = 'http://localhost:3100';
const CDS_BASE_URL = USE_PROXY ? PROXY_URL : 'https://34.93.141.21.sslip.io';

// Generate unique IDs for Beckn context
const generateId = () => crypto.randomUUID();

// Build Beckn context for requests
const buildContext = (action) => ({
  version: '2.0.0',
  action,
  timestamp: new Date().toISOString(),
  message_id: generateId(),
  transaction_id: generateId(),
  ttl: 'PT30S',
  ...(action === 'discover'
    ? {
        bap_id: 'driver-discovery-demo.app',
        bap_uri: 'https://demo.app/callbacks',
        schema_context: [
          "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/driver/v1/context.jsonld",
          "https://example.org/schema/driver/v1/context.jsonld", "https://example.org/schema/driver-job/v1/context.jsonld"
        ]
      }
    : {
        bpp_id: 'driver-provider-demo.app',
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
  const context = buildContext('discover');
  
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
    
    // Add API key only if provided
    if (apiKey) {
      headers['x-api-key'] = apiKey;
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
    return { success: true, data, requestBody };
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
    
    // Add API key only if provided
    if (apiKey) {
      headers['x-api-key'] = apiKey;
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
