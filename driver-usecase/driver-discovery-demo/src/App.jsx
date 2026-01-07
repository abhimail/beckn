import { useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { discoverItems, publishCatalogues } from './utils/cdsClient'
import { generateCatalogues } from './utils/sampleDataGenerator'

// Fix Leaflet icon issue with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function App() {
  // Role: 'provider' (searching for drivers) or 'driver' (searching for jobs)
  const [role, setRole] = useState('provider');
  const [apiKey, setApiKey] = useState('default');
  
  // Search inputs
  const [textSearch, setTextSearch] = useState('');
  const [jsonPathExpression, setJsonPathExpression] = useState('');
  const [geoLat, setGeoLat] = useState('');
  const [geoLon, setGeoLon] = useState('');
  const [geoRadius, setGeoRadius] = useState('');
  
  // UI state
  const [activeTab, setActiveTab] = useState('discover'); // 'discover' or 'publish'
  const [showDebug, setShowDebug] = useState(false);
  
  // Discover Results
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [discoverRequest, setDiscoverRequest] = useState(null);
  const [discoverResponse, setDiscoverResponse] = useState(null);
  
  // Publish state
  const [publishStatus, setPublishStatus] = useState(null);
  const [generatedCatalogues, setGeneratedCatalogues] = useState(null);
  const [driverCount, setDriverCount] = useState(10);
  const [jobCount, setJobCount] = useState(10);
  const [uploadedFileName, setUploadedFileName] = useState(null);
  const [publishRequest, setPublishRequest] = useState(null);
  const [publishResponse, setPublishResponse] = useState(null);
  const fileInputRef = useRef(null);
  
  // Handle discover search
  const handleDiscover = async () => {
    const hasTextSearch = textSearch.trim().length > 0;
    const hasJsonPath = jsonPathExpression.trim().length > 0;
    const hasGeo = geoLat && geoLon && geoRadius;
    
    if (!hasTextSearch && !hasJsonPath && !hasGeo) {
      setError('Please enter at least one search criterion');
      return;
    }
    
    setLoading(true);
    setError(null);
    setResults([]);
    
    const result = await discoverItems({
      textSearch,
      jsonPathFilter: jsonPathExpression ? { expression: jsonPathExpression } : null,
      geoFilter: hasGeo ? { lat: geoLat, lon: geoLon, radiusKm: geoRadius } : null,
      apiKey: apiKey.trim() || undefined,
      role
    });
    
    setLoading(false);
    setDiscoverRequest(result.requestBody);
    
    if (result.success) {
      setDiscoverResponse(result.data);
      // Extract items from catalogs, preserving provider information
      const items = [];
      if (result.data.message && result.data.message.catalogs) {
        result.data.message.catalogs.forEach(catalog => {
          items.push(...catalog['beckn:items']);
        });
      }
      setResults(items);
    } else {
      setError(result.error);
      setDiscoverResponse(null);
    }
  };
  
  // Handle generate catalogues
  const handleGenerate = () => {
    const catalogues = generateCatalogues(driverCount, jobCount);
    setGeneratedCatalogues(catalogues);
    setPublishStatus({ success: true, message: `Generated ${driverCount} drivers + ${jobCount} jobs` });
  };
  
  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        setGeneratedCatalogues(json);
        setUploadedFileName(file.name);
        setPublishStatus({ success: true, message: `Loaded catalogue from ${file.name}` });
      } catch (error) {
        setError('Invalid JSON file');
        setPublishStatus({ success: false, message: 'Invalid JSON file' });
      }
    };
    reader.readAsText(file);
  };
  
  // Handle publish catalogues
  const handlePublish = async () => {
    if (!generatedCatalogues) {
      setError('Please generate or load catalogues first');
      return;
    }
    
    setLoading(true);
    setError(null);
    setPublishStatus(null);
    
    const result = await publishCatalogues(generatedCatalogues, apiKey.trim() || undefined);
    
    setLoading(false);
    setPublishRequest(result.requestBody);
    
    if (result.success) {
      setPublishResponse(result.data);
      const countMsg = uploadedFileName 
        ? `from ${uploadedFileName}` 
        : `(${driverCount} drivers + ${jobCount} jobs)`;
      setPublishStatus({
        success: true,
        message: `Successfully published catalogues ${countMsg}`,
        data: result.data
      });
    } else {
      setError(result.error);
      setPublishStatus({
        success: false,
        message: result.error
      });
    }
  };
  
  // Handle download
  const handleDownload = () => {
    if (!generatedCatalogues) return;
    const dataStr = JSON.stringify(generatedCatalogues, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `driver-catalogues-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };
  
  // Extract location from item
  const getItemLocation = (item) => {
    const attrs = item['beckn:itemAttributes'];
    if (!attrs) return null;
    
    const locationField = role === 'provider' ? 'driver:homeLocation' : 'job:jobLocation';
    const location = attrs[locationField];
    if (!location || !location.geo) return null;
    
    const coords = location.geo.coordinates;
    return { lat: coords[1], lon: coords[0], locality: location.addressLocality };
  };
  
  // Render item card - ONDC style
  const renderItemCard = (item) => {
    const descriptor = item['beckn:descriptor'];
    const rating = item['beckn:rating'];
    const attrs = item['beckn:itemAttributes'];
    const location = getItemLocation(item);
    const provider = item['beckn:provider']['beckn:id'];
    
    // Select icon based on role
    const icon = role === 'provider' ? '👤' : '💼';
    const categoryBadge = role === 'provider' ? 'DRIVER' : 'JOB';
    
    return (
      <div key={item['beckn:id']} className="item-card">
        {/* Image Container */}
        <div className="item-image-container">
          <div className="item-image">
            {icon}
          </div>
          {attrs && (
            <div className="item-price-overlay">
              ₹ {(role === 'provider' 
                ? attrs['driver:salaryExpectation'] 
                : attrs['job:salaryOffered']
              )?.toLocaleString()}
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="item-content">
          <div className="item-header">
            <h3 className="item-title">{descriptor['schema:name']}</h3>
            <div className="item-category-badge">{provider}</div>
          </div>

          <p className="item-description">{descriptor['beckn:shortDesc']}</p>          
          {/* Attributes */}
          {attrs && (
            <div className="item-attributes">
              {role === 'provider' ? (
                <>
                  <div className="item-attr-pill">
                    Exp: {attrs['driver:experienceYears']} years
                  </div>
                  <div className="item-attr-pill">
                    {attrs['driver:vehicleCategory']}
                  </div>
                  {location && (
                    <div className="item-attr-pill">
                      📍 {location.locality}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="item-attr-pill">
                    Min Exp: {attrs['job:minExperienceYears']} years
                  </div>
                  <div className="item-attr-pill">
                    {attrs['job:vehicleCategoryRequired']}
                  </div>
                  {location && (
                    <div className="item-attr-pill">
                      📍 {location.locality}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          
          {/* Specs */}
          {attrs && (
            <div className="item-specs">
              {role === 'provider' ? (
                <>
                  <div className="item-spec-pill">
                    Status: {attrs['driver:policeVerificationStatus']}
                  </div>
                  {attrs['driver:vehicleCategory'] === 'BUS' && attrs['driver:busExperienceYears'] > 0 && (
                    <div className="item-spec-pill">
                      Bus: {attrs['driver:busExperienceYears']}y
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="item-spec-pill">
                    Police Verification: {attrs['job:requiresPoliceVerification'] ? 'Required' : 'Not Required'}
                  </div>
                  {attrs['job:employerRating'] && (
                    <div className="item-spec-pill">
                      Employer: ⭐ {attrs['job:employerRating']}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          
          {/* Rating */}
          {rating && (
            <div className="item-rating">
              <div className="item-rating-stars">
                {'★'.repeat(Math.round(rating['beckn:ratingValue']))}
                {'☆'.repeat(5 - Math.round(rating['beckn:ratingValue']))}
              </div>
              <span className="item-rating-value">{rating['beckn:ratingValue']}</span>
              <span className="item-rating-count">({rating['beckn:ratingCount']} ratings)</span>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="app-layout">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div style={{fontSize: '20px', fontWeight: '600', marginBottom: '10px'}}>← Driver Discovery</div>
        </div>
        <div className="sidebar-title">NAVIGATION</div>
        <div 
          className={`sidebar-item ${role === 'provider' && activeTab === 'discover' ? 'active' : ''}`} 
          onClick={() => {
            setRole('provider');
            setActiveTab('discover');
            // Reset search results, inputs, and request/response when changing role
            setResults([]);
            setDiscoverRequest(null);
            setDiscoverResponse(null);
            setError(null);
            setTextSearch('');
            setJsonPathExpression('');
            setGeoLat('');
            setGeoLon('');
            setGeoRadius('');
          }}
        >
          <span className="sidebar-icon">👤</span>
          <div>
            <div style={{fontWeight: '500'}}>Provider</div>
            <div style={{fontSize: '11px', opacity: 0.7}}>Find Drivers</div>
          </div>
        </div>
        <div 
          className={`sidebar-item ${role === 'driver' && activeTab === 'discover' ? 'active' : ''}`} 
          onClick={() => {
            setRole('driver');
            setActiveTab('discover');
            // Reset search results, inputs, and request/response when changing role
            setResults([]);
            setDiscoverRequest(null);
            setDiscoverResponse(null);
            setError(null);
            setTextSearch('');
            setJsonPathExpression('');
            setGeoLat('');
            setGeoLon('');
            setGeoRadius('');
          }}
        >
          <span className="sidebar-icon">�</span>
          <div>
            <div style={{fontWeight: '500'}}>Driver</div>
            <div style={{fontSize: '11px', opacity: 0.7}}>Find Jobs</div>
          </div>
        </div>
        <div 
          className={`sidebar-item ${activeTab === 'publish' ? 'active' : ''}`} 
          onClick={() => setActiveTab('publish')}
        >
          <span className="sidebar-icon">�📤</span>
          <div>
            <div style={{fontWeight: '500'}}>Publish</div>
            <div style={{fontSize: '11px', opacity: 0.7}}>Catalogue Management</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header with gradient */}
        <div className="header-gradient">
          <div className="header-title">Driver Discovery Demo</div>
          <div className="header-subtitle">
            Beckn Gen2 CDS discovery using NLP, JSONPath, and GeoJSON
          </div>
          <div style={{marginTop: '15px'}}>
            <input
              type="password"
              placeholder="Enter CDS API Key (x-api-key) - Optional"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              style={{
                padding: '10px 15px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.15)',
                color: 'white',
                width: '400px',
                fontSize: '14px'
              }}
            />
          </div>
        </div>
        
        {/* Container */}
        <div className="container">
          {activeTab === 'discover' ? (
            <div className="three-column-layout">
              {/* Column 1: Discover Criteria */}
              <div className="card criteria-card">
                <div className="card-header">
                  <h2 className="card-title">Discover Criteria</h2>
                  <p className="card-subtitle">
                    Run sample Beckn <code>discover</code> requests for {role === 'provider' ? 'drivers' : 'jobs'}
                  </p>
                </div>
                
                <div className="form-group">
                  <label>NL Search (Natural Language)</label>
                  <textarea
                    placeholder={role === 'provider' 
                      ? "e.g., drivers in Koramangala with <30000 salary expectation"
                      : "e.g., bus driving jobs in Bellary with 4+ star rating"
                    }
                    value={textSearch}
                    onChange={(e) => setTextSearch(e.target.value)}
                    rows={3}
                    style={{width: '100%', resize: 'vertical'}}
                  />
                </div>
                
                <div className="form-group">
                  <label>JSONPath Expression (optional)</label>
                  <textarea
                    placeholder={role === 'provider'
                      ? "$[?(@.beckn:itemAttributes.driver:salaryExpectation < 30000)]"
                      : "$[?(@.beckn:itemAttributes.job:salaryOffered > 25000)]"
                    }
                    value={jsonPathExpression}
                    onChange={(e) => setJsonPathExpression(e.target.value)}
                    rows={3}
                    style={{width: '100%', fontFamily: 'monospace', fontSize: '12px', resize: 'vertical'}}
                  />
                  <small style={{color: '#666', fontSize: '12px'}}>JSONPath expression for filtering items</small>
                </div>
                
                <div className="form-group">
                  <label>GeoJSON (optional)</label>
                  <input
                    type="text"
                    placeholder="Latitude (e.g., 12.9352)"
                    value={geoLat}
                    onChange={(e) => setGeoLat(e.target.value)}
                    style={{width: '100%', marginBottom: '8px'}}
                  />
                  <input
                    type="text"
                    placeholder="Longitude (e.g., 77.6245)"
                    value={geoLon}
                    onChange={(e) => setGeoLon(e.target.value)}
                    style={{width: '100%', marginBottom: '8px'}}
                  />
                  <input
                    type="text"
                    placeholder="Radius (km)"
                    value={geoRadius}
                    onChange={(e) => setGeoRadius(e.target.value)}
                    style={{width: '100%'}}
                  />
                  <small style={{color: '#666', fontSize: '12px'}}>Enter as: latitude,longitude</small>
                </div>
                
                <button onClick={handleDiscover} disabled={loading} className="btn-primary">
                  {loading ? 'Discovering...' : 'Discover'}
                </button>
                
                {error && (
                  <div style={{padding: '10px', background: '#f8d7da', color: '#721c24', borderRadius: '4px', marginTop: '15px', fontSize: '13px'}}>
                    ❌ {error}
                  </div>
                )}
              </div>
              
              {/* Column 2: Search Results */}
              <div className="card results-card">
                <div className="card-header">
                  <h2 className="card-title">Search Results</h2>
                  <p className="card-subtitle">
                    {results.length > 0 
                      ? `Found ${results.length} ${role === 'provider' ? 'drivers' : 'jobs'}`
                      : 'Results will appear here after discovery'
                    }
                  </p>
                </div>
                
                {results.length > 0 ? (
                  <div className="results-scroll">
                    {results.map(renderItemCard)}
                  </div>
                ) : (
                  <div style={{textAlign: 'center', padding: '40px', color: '#999'}}>
                    <div style={{fontSize: '48px', marginBottom: '10px'}}>🔍</div>
                    <p>No results yet. Use discover criteria to search.</p>
                  </div>
                )}
              </div>
              
              {/* Column 3: Request/Response Payload */}
              <div className="card payload-card">
                <div className="card-header">
                  <h2 className="card-title">Request / Response</h2>
                  <p className="card-subtitle">Debug information</p>
                </div>
                
                {discoverRequest ? (
                  <div className="payload-content">
                    <h3 style={{fontSize: '14px', fontWeight: '600', marginBottom: '10px', color: '#333'}}>Request</h3>
                    <pre style={{fontSize: '10px', maxHeight: '250px', overflow: 'auto'}}>{JSON.stringify(discoverRequest, null, 2)}</pre>
                    
                    {discoverResponse && (
                      <>
                        <h3 style={{fontSize: '14px', fontWeight: '600', margin: '15px 0 10px', color: '#333'}}>Response</h3>
                        <pre style={{fontSize: '10px', maxHeight: '250px', overflow: 'auto'}}>{JSON.stringify(discoverResponse, null, 2)}</pre>
                      </>
                    )}
                  </div>
                ) : (
                  <div style={{textAlign: 'center', padding: '40px 10px', color: '#999'}}>
                    <div style={{fontSize: '36px', marginBottom: '10px'}}>📋</div>
                    <p style={{fontSize: '13px'}}>Request and response payloads will appear here</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="search-panel">
              <h2>Catalogue Management</h2>
              <p style={{marginBottom: '20px', color: '#666'}}>
                Generate, load, download, and publish driver and job catalogue data to CDS.
              </p>
              
              {/* Generate Section */}
              <div style={{marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #e0e0e0'}}>
                <h3 style={{marginBottom: '15px', fontSize: '18px'}}>Generate Catalogue Data</h3>
                <div className="form-row" style={{marginBottom: '15px'}}>
                  <div className="form-group">
                    <label>Number of Drivers</label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={driverCount}
                      onChange={(e) => setDriverCount(parseInt(e.target.value) || 0)}
                      style={{width: '100%'}}
                    />
                  </div>
                  <div className="form-group">
                    <label>Number of Jobs</label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={jobCount}
                      onChange={(e) => setJobCount(parseInt(e.target.value) || 0)}
                      style={{width: '100%'}}
                    />
                  </div>
                </div>
                <button 
                  onClick={handleGenerate}
                  disabled={driverCount <= 0 || jobCount <= 0}
                >
                  🔄 Generate Catalogue
                </button>
                {generatedCatalogues && (
                  <div style={{marginTop: '15px', padding: '15px', background: '#f7fafc', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
                    <div style={{fontSize: '14px', fontWeight: '600', marginBottom: '10px', color: '#2d3748'}}>
                      📦 Catalogue Summary
                    </div>
                    <div style={{fontSize: '13px', color: '#4a5568', lineHeight: '1.8'}}>
                      <div>• Providers: {generatedCatalogues.length || 0}</div>
                      <div>• Total Items: {generatedCatalogues.reduce((acc, cat) => acc + (cat['beckn:items']?.length || 0), 0)}</div>
                      <div>• Drivers: {generatedCatalogues.reduce((acc, cat) => {
                        const driverItems = cat['beckn:items']?.filter(item => 
                          item['beckn:itemAttributes']?.['driver:experienceYears'] !== undefined
                        ) || [];
                        return acc + driverItems.length;
                      }, 0)}</div>
                      <div>• Jobs: {generatedCatalogues.reduce((acc, cat) => {
                        const jobItems = cat['beckn:items']?.filter(item => 
                          item['beckn:itemAttributes']?.['job:minExperienceYears'] !== undefined
                        ) || [];
                        return acc + jobItems.length;
                      }, 0)}</div>
                    </div>
                  </div>
                )}                
              </div>

              {/* Download Section */}
              <div style={{marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #e0e0e0'}}>
                <h3 style={{marginBottom: '15px', fontSize: '18px'}}>Download Catalogue</h3>
                <p style={{marginBottom: '15px', color: '#666', fontSize: '14px'}}>
                  Download the generated/loaded catalogues as JSON file.
                </p>
                <button 
                  onClick={handleDownload}
                  disabled={!generatedCatalogues}
                  className="secondary"
                >
                  💾 Download JSON
                </button>
              </div>              
              
              {/* Load from File Section */}
              <div style={{marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #e0e0e0'}}>
                <h3 style={{marginBottom: '15px', fontSize: '18px'}}>Load Catalogue from File</h3>
                <p style={{marginBottom: '15px', color: '#666', fontSize: '14px'}}>
                  Choose an existing JSON catalogue file from your file system.
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  onChange={handleFileUpload}
                  style={{display: 'none'}}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="secondary"
                >
                  📁 Choose JSON File
                </button>
                {uploadedFileName && (
                  <div style={{marginTop: '10px', fontSize: '13px', color: '#666'}}>
                    Loaded: <strong>{uploadedFileName}</strong>
                  </div>
                )}
              </div>
              
              {/* Publish Section */}
              <div style={{marginBottom: '20px'}}>
                <h3 style={{marginBottom: '15px', fontSize: '18px'}}>Publish to CDS</h3>
                <p style={{marginBottom: '15px', color: '#666', fontSize: '14px'}}>
                  Upload the catalogues to the CDS for discovery.
                </p>
                <button 
                  onClick={handlePublish}
                  disabled={loading || !generatedCatalogues}
                >
                  {loading ? 'Publishing...' : '📤 Publish to CDS'}
                </button>
              </div>
              
              {/* Status Messages */}
              {publishStatus && (
                <div
                  style={{
                    padding: '15px',
                    marginTop: '20px',
                    background: publishStatus.success ? '#d4edda' : '#f8d7da',
                    color: publishStatus.success ? '#155724' : '#721c24',
                    borderRadius: '4px'
                  }}
                >
                  {publishStatus.success ? '✅' : '❌'} {publishStatus.message}
                </div>
              )}
              
              {error && (
                <div style={{padding: '10px', background: '#f8d7da', color: '#721c24', borderRadius: '4px', marginTop: '10px'}}>
                  ❌ {error}
                </div>
              )}
              
              {/* Debug Panel */}
              {publishRequest && (
                <div className="debug-panel" style={{marginTop: '20px'}}>
                  <div
                    className="collapsible-header"
                    onClick={() => setShowDebug(!showDebug)}
                  >
                    <span>🔍 Request / Response</span>
                    <span>{showDebug ? '▼' : '▶'}</span>
                  </div>
                  {showDebug && (
                    <div className="collapsible-content">
                      <h3>Publish Request</h3>
                      <pre>{JSON.stringify(publishRequest, null, 2)}</pre>
                      
                      {publishResponse && (
                        <>
                          <h3 style={{marginTop: '20px'}}>Publish Response</h3>
                          <pre>{JSON.stringify(publishResponse, null, 2)}</pre>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
