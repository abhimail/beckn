// Generate synthetic sample data for drivers and jobs

const CITIES = [
  { name: 'Koramangala, Bengaluru', lat: 12.9352, lon: 77.6245, region: 'Karnataka' },
  { name: 'Bellary', lat: 15.1394, lon: 76.9214, region: 'Karnataka' },
  { name: 'Bangalore City', lat: 12.9716, lon: 77.5946, region: 'Karnataka' },
  { name: 'Mysore', lat: 12.2958, lon: 76.6394, region: 'Karnataka' }
];

const FIRST_NAMES = ['Rajesh', 'Suresh', 'Kumar', 'Ramesh', 'Vijay', 'Anil', 'Prakash', 'Mohan', 'Ravi', 'Ganesh'];
const LAST_NAMES = ['Kumar', 'Singh', 'Reddy', 'Rao', 'Sharma', 'Patel', 'Desai', 'Naik', 'Gowda', 'Shetty'];

const VEHICLE_CATEGORIES = ['BUS', 'TAXI', 'TRUCK'];
const POLICE_VERIFICATION_STATUS = ['VERIFIED', 'NOT_VERIFIED', 'EXPIRED'];

// Provider configurations
const DRIVER_PROVIDERS = [
  { id: 'driver-aggregator-001', name: 'Premium Driver Services', domain: 'premium-drivers.example.com' },
  { id: 'driver-aggregator-002', name: 'Quick Hire Drivers', domain: 'quickhire-drivers.example.com' },
  { id: 'driver-aggregator-003', name: 'Elite Driver Pool', domain: 'elite-drivers.example.com' },
  { id: 'driver-aggregator-004', name: 'Local Driver Network', domain: 'local-drivers.example.com' }
];

const JOB_PROVIDERS = [
  { id: 'job-provider-001', name: 'City Transport Jobs', domain: 'citytransport-jobs.example.com' },
  { id: 'job-provider-002', name: 'Highway Careers', domain: 'highway-careers.example.com' },
  { id: 'job-provider-003', name: 'Metro Driver Opportunities', domain: 'metro-drivers.example.com' },
  { id: 'job-provider-004', name: 'Express Logistics Jobs', domain: 'express-logistics.example.com' }
];

// Random number generator utilities
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max, decimals = 2) => parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Generate a random location near a city
const randomLocationNear = (city, radiusKm = 5) => {
  const radiusDeg = radiusKm / 111; // Approximate km to degrees
  const lat = city.lat + (Math.random() - 0.5) * radiusDeg * 2;
  const lon = city.lon + (Math.random() - 0.5) * radiusDeg * 2;
  return { lat: parseFloat(lat.toFixed(6)), lon: parseFloat(lon.toFixed(6)) };
};

/**
 * Generate driver candidates
 */
export function generateDriverCandidates(count = 10) {
  const drivers = [];
  
  for (let i = 0; i < count; i++) {
    const city = randomChoice(CITIES);
    const location = randomLocationNear(city);
    const firstName = randomChoice(FIRST_NAMES);
    const lastName = randomChoice(LAST_NAMES);
    const vehicleCategory = randomChoice(VEHICLE_CATEGORIES);
    const experienceYears = randomInt(0, 15);
    
    const driver = {
      '@context': 'https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld',
      '@type': 'beckn:Item',
      'beckn:id': `driver-${i + 1}`,
      'beckn:descriptor': {
        '@type': 'beckn:Descriptor',
        'schema:name': `${firstName} ${lastName}`,
        'beckn:shortDesc': `${vehicleCategory} driver with ${experienceYears} years experience`
      },
      'beckn:category': {
        '@type': 'schema:CategoryCode',
        'schema:codeValue': 'driver-candidate',
        'schema:name': 'Driver Candidate'
      },
      'beckn:rateable': true,
      'beckn:rating': {
        '@type': 'beckn:Rating',
        'beckn:ratingValue': randomFloat(3.0, 5.0, 1),
        'beckn:ratingCount': randomInt(10, 500)
      },
      'beckn:itemAttributes': {
        '@context': 'https://example.org/schema/driver/v1/context.jsonld',
        '@type': 'beckn:DriverCandidateAttributes',
        'driver:salaryExpectation': randomInt(18000, 45000),
        'driver:policeVerificationStatus': randomChoice(POLICE_VERIFICATION_STATUS),
        'driver:experienceYears': experienceYears,
        'driver:vehicleCategory': vehicleCategory,
        'driver:busExperienceYears': vehicleCategory === 'BUS' ? randomInt(0, experienceYears) : 0,
        'driver:homeLocation': {
          'geo': {
            'type': 'Point',
            'coordinates': [location.lon, location.lat]
          },
          'addressLocality': city.name,
          'addressRegion': city.region,
          'addressCountry': 'IN'
        }
      }
    };
    
    drivers.push(driver);
  }
  
  return drivers;
}

/**
 * Generate job descriptions
 */
export function generateJobDescriptions(count = 10) {
  const jobs = [];
  
  const JOB_TITLES = [
    'Bus Driver - City Routes',
    'Intercity Bus Driver',
    'Taxi Driver - Airport Shuttle',
    'Truck Driver - Long Haul',
    'Delivery Van Driver',
    'School Bus Driver'
  ];
  
  for (let i = 0; i < count; i++) {
    const city = randomChoice(CITIES);
    const location = randomLocationNear(city);
    const title = randomChoice(JOB_TITLES);
    const vehicleCategory = randomChoice(VEHICLE_CATEGORIES);
    const minExperience = randomInt(0, 10);
    const requiresVerification = Math.random() > 0.3; // 70% require verification
    
    const job = {
      '@context': 'https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/core/v2/context.jsonld',
      '@type': 'beckn:Item',
      'beckn:id': `job-${i + 1}`,
      'beckn:descriptor': {
        '@type': 'beckn:Descriptor',
        'schema:name': title,
        'beckn:shortDesc': `${vehicleCategory} driving position in ${city.name}`
      },
      'beckn:category': {
        '@type': 'schema:CategoryCode',
        'schema:codeValue': 'driver-job',
        'schema:name': 'Driver Job'
      },
      'beckn:rateable': true,
      'beckn:rating': {
        '@type': 'beckn:Rating',
        'beckn:ratingValue': randomFloat(3.0, 5.0, 1),
        'beckn:ratingCount': randomInt(5, 200)
      },
      'beckn:itemAttributes': {
        '@context': 'https://example.org/schema/driver-job/v1/context.jsonld',
        '@type': 'beckn:DriverJobDescriptionAttributes',
        'job:salaryOffered': randomInt(10000, 50000),
        'job:requiresPoliceVerification': requiresVerification,
        'job:minExperienceYears': minExperience,
        'job:vehicleCategoryRequired': vehicleCategory,
        'job:jobLocation': {
          'geo': {
            'type': 'Point',
            'coordinates': [location.lon, location.lat]
          },
          'addressLocality': city.name,
          'addressRegion': city.region,
          'addressCountry': 'IN'
        },
        'job:employerRating': randomFloat(3.5, 5.0, 1)
      }
    };
    
    jobs.push(job);
  }
  
  return jobs;
}

/**
 * Generate catalogues for publishing
 * @param {number} driverCount - Number of driver candidates to generate
 * @param {number} jobCount - Number of job descriptions to generate
 */
export function generateCatalogues(driverCount = 10, jobCount = 10) {
  const drivers = generateDriverCandidates(driverCount);
  const jobs = generateJobDescriptions(jobCount);
  
  // Distribute drivers across 4 providers
  const driversPerProvider = Math.ceil(driverCount / DRIVER_PROVIDERS.length);
  const driverCatalogues = [];
  
  DRIVER_PROVIDERS.forEach((providerConfig, index) => {
    const startIdx = index * driversPerProvider;
    const endIdx = Math.min(startIdx + driversPerProvider, drivers.length);
    const providerDrivers = drivers.slice(startIdx, endIdx);
    
    if (providerDrivers.length === 0) return;
    
    const driverProvider = {
      'beckn:id': providerConfig.id,
      'beckn:descriptor': {
        '@type': 'beckn:Descriptor',
        'schema:name': providerConfig.name,
        'beckn:shortDesc': `Driver aggregator platform - ${providerConfig.name}`
      }
    };
    
    const driversWithProvider = providerDrivers.map(driver => ({
      ...driver,
      'beckn:provider': driverProvider
    }));
    
    const catalogue = {
      '@context': 'https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/main/schema/core/v2/context.jsonld',
      '@type': 'beckn:Catalog',
      'beckn:id': `driver-catalog-${providerConfig.id}`,
      'beckn:bppId': providerConfig.domain,
      'beckn:bppUri': `https://${providerConfig.domain}`,
      'beckn:descriptor': {
        '@type': 'beckn:Descriptor',
        'schema:name': `${providerConfig.name} - Driver Candidates`,
        'beckn:shortDesc': `Driver candidates from ${providerConfig.name}`
      },
      'beckn:items': driversWithProvider
    };
    
    driverCatalogues.push(catalogue);
  });
  
  // Distribute jobs across 4 providers
  const jobsPerProvider = Math.ceil(jobCount / JOB_PROVIDERS.length);
  const jobCatalogues = [];
  
  JOB_PROVIDERS.forEach((providerConfig, index) => {
    const startIdx = index * jobsPerProvider;
    const endIdx = Math.min(startIdx + jobsPerProvider, jobs.length);
    const providerJobs = jobs.slice(startIdx, endIdx);
    
    if (providerJobs.length === 0) return;
    
    const jobProvider = {
      'beckn:id': providerConfig.id,
      'beckn:descriptor': {
        '@type': 'beckn:Descriptor',
        'schema:name': providerConfig.name,
        'beckn:shortDesc': `Job posting platform - ${providerConfig.name}`
      }
    };
    
    const jobsWithProvider = providerJobs.map(job => ({
      ...job,
      'beckn:provider': jobProvider
    }));
    
    const catalogue = {
      '@context': 'https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/main/schema/core/v2/context.jsonld',
      '@type': 'beckn:Catalog',
      'beckn:id': `job-catalog-${providerConfig.id}`,
      'beckn:bppId': providerConfig.domain,
      'beckn:bppUri': `https://${providerConfig.domain}`,
      'beckn:descriptor': {
        '@type': 'beckn:Descriptor',
        'schema:name': `${providerConfig.name} - Job Postings`,
        'beckn:shortDesc': `Driver job opportunities from ${providerConfig.name}`
      },
      'beckn:items': jobsWithProvider
    };
    
    jobCatalogues.push(catalogue);
  });
  
  return [...driverCatalogues, ...jobCatalogues];
}
