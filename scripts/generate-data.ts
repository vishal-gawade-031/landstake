import * as fs from 'fs';
import * as path from 'path';

interface ParcelMeta {
  ulpin: string;
  surveyNo: string;
  subDivision: string;
  district: string;
  taluk: string;
  village: string;
  hobli: string;
  area: number; // recorded area
  gisArea: number;
  areaDifference: number;
  landUse: string;
  status: string;
  centroidLat: number;
  centroidLng: number;
  boundsJson: string;
  geojsonGeometry: any;
  riskScore: number;
  riskLevel: string;
  riskReasons: string[];
  hasBoundaryOverlap: boolean;
  hasAreaMismatch: boolean;
  hasOwnershipConflict: boolean;
  hasRegistrationConflict: boolean;
  hasEncumbrance: boolean;
  hasTaxIssue: boolean;
  ownerName: string;
  annualTax: number;
  taxStatus: string;
}

const landUses = ['Residential', 'Agricultural', 'Commercial', 'Industrial', 'Institutional', 'Mixed Use'];

function createPolygon(centerLng: number, centerLat: number, widthMeters: number, heightMeters: number, jitter: number = 0.00005) {
  // 1 deg lat approx 111,000 meters; 1 deg lng approx 111,000 * cos(lat)
  const latScale = 1 / 111000;
  const lngScale = 1 / (111000 * Math.cos((centerLat * Math.PI) / 180));

  const dLng = (widthMeters / 2) * lngScale;
  const dLat = (heightMeters / 2) * latScale;

  // 4 corners + closing point with slight realistic parcel irregular shape
  const ring = [
    [centerLng - dLng, centerLat - dLat],
    [centerLng + dLng + jitter, centerLat - dLat + jitter * 0.5],
    [centerLng + dLng * 0.95, centerLat + dLat],
    [centerLng - dLng - jitter * 0.3, centerLat + dLat * 0.9],
    [centerLng - dLng, centerLat - dLat],
  ];

  return {
    type: 'Polygon',
    coordinates: [ring],
  };
}

export function generateAllParcels() {
  const parcels: ParcelMeta[] = [];
  const geojsonFeatures: any[] = [];

  // District 1: Belagavi (45 parcels)
  const belagaviTaluks = [
    { name: 'Belagavi', villages: ['Demo Village', 'Sambra', 'Vadgaon', 'Peeranwadi'] },
    { name: 'Gokak', villages: ['Gokak Falls Rural', 'Konnur'] },
    { name: 'Chikkodi', villages: ['Examba', 'Nipani Road'] },
    { name: 'Bailhongal', villages: ['Kittur Sub-cadastre', 'Sampgaon'] },
  ];

  const belagaviBaseLng = 74.4977;
  const belagaviBaseLat = 15.8497;

  let counter = 101;
  for (let i = 0; i < 45; i++) {
    const talukObj = belagaviTaluks[i % belagaviTaluks.length];
    const village = talukObj.villages[i % talukObj.villages.length];
    const ulpin = `KA-BLG-001-000${counter}`;
    const surveyNo = `${counter}/${String.fromCharCode(65 + (i % 6))}`;

    const row = Math.floor(i / 7);
    const col = i % 7;
    // Spacing between parcels ~ 120m
    let cLng = belagaviBaseLng + (col * 0.0018) + (Math.sin(i) * 0.0003);
    let cLat = belagaviBaseLat + (row * 0.0016) + (Math.cos(i) * 0.0002);

    // Intentional overlap between KA-BLG-001-000105 and KA-BLG-001-000106
    if (counter === 106) {
      // Shift towards 105 slightly to create ~12.5 sq.m overlap
      const prevLng = belagaviBaseLng + (4 * 0.0018) + (Math.sin(4) * 0.0003);
      const prevLat = belagaviBaseLat + (0 * 0.0016) + (Math.cos(4) * 0.0002);
      cLng = prevLng + 0.00045; // slight overlap
      cLat = prevLat + 0.00005;
    }

    const landUse = counter === 101 ? 'Residential' : landUses[i % landUses.length];
    const recArea = counter === 101 ? 2.50 : +(1.2 + (i * 0.17) % 4.5).toFixed(2);
    // Calculated GIS area
    let gisArea = counter === 101 ? 2.48 : +(recArea + (i % 4 === 0 ? 0.28 : (i % 3 === 0 ? -0.04 : 0.01))).toFixed(2);
    if (gisArea < 0.2) gisArea = 0.5;
    const areaDiff = +Math.abs(recArea - gisArea).toFixed(2);

    // High / Medium / Low risk flags
    const hasOverlap = counter === 105 || counter === 106;
    const hasAreaMismatch = areaDiff >= 0.25;
    const hasOwnershipConflict = counter === 112 || counter === 128;
    const hasRegConflict = counter === 118 || counter === 135;
    const hasEncumbrance = i % 4 === 1;
    const hasTaxIssue = i % 5 === 0;

    let riskScore = 12;
    const reasons: string[] = [];
    if (hasAreaMismatch) { riskScore += 20; reasons.push('Potential Area Mismatch detected between GIS and Cadastral Register'); }
    if (hasOverlap) { riskScore += 20; reasons.push('Potential Boundary Conflict with neighboring parcel'); }
    if (hasOwnershipConflict) { riskScore += 25; reasons.push('Active ownership dispute filed with Revenue Court'); }
    if (hasRegConflict) { riskScore += 20; reasons.push('Multiple recent deed transactions without mutation clearance'); }
    if (hasEncumbrance) { riskScore += 10; reasons.push('Active commercial bank mortgage lien attached'); }
    if (hasTaxIssue) { riskScore += 5; reasons.push('Property tax overdue for > 2 financial years'); }

    if (riskScore > 100) riskScore = 100;
    let riskLevel = 'LOW';
    if (riskScore > 75) riskLevel = 'CRITICAL';
    else if (riskScore > 50) riskLevel = 'HIGH';
    else if (riskScore > 25) riskLevel = 'MEDIUM';

    let status = 'VERIFIED';
    if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') status = 'RESTRICTED';
    else if (hasOwnershipConflict) status = 'DISPUTED';
    else if (counter % 7 === 0) status = 'PENDING_VERIFICATION';

    const geom = createPolygon(cLng, cLat, 75 + (i % 5) * 10, 65 + (i % 4) * 8);

    const bounds = [
      [cLat - 0.0006, cLng - 0.0007],
      [cLat + 0.0006, cLng + 0.0007],
    ];

    const parcel: ParcelMeta = {
      ulpin,
      surveyNo,
      subDivision: `${(i % 4) + 1}`,
      district: 'Belagavi',
      taluk: talukObj.name,
      village,
      hobli: `${talukObj.name} Central`,
      area: recArea,
      gisArea,
      areaDifference: areaDiff,
      landUse,
      status,
      centroidLat: +cLat.toFixed(6),
      centroidLng: +cLng.toFixed(6),
      boundsJson: JSON.stringify(bounds),
      geojsonGeometry: geom,
      riskScore,
      riskLevel,
      riskReasons: reasons,
      hasBoundaryOverlap: hasOverlap,
      hasAreaMismatch,
      hasOwnershipConflict,
      hasRegistrationConflict: hasRegConflict,
      hasEncumbrance,
      hasTaxIssue,
      ownerName: `Sri ${['Basavaraj Bommai', 'Anand Kulkarni', 'Suresh Patil', 'Mallikarjun Hiremath', 'Lakshmi Hebbalkar', 'Ramesh Jarkiholi', 'Priyanka Patil', 'Santosh Lad'][i % 8]}`,
      annualTax: +(4500 + (i * 350)).toFixed(0),
      taxStatus: hasTaxIssue ? 'OVERDUE' : (i % 6 === 0 ? 'PARTIAL' : 'PAID'),
    };

    parcels.push(parcel);

    geojsonFeatures.push({
      type: 'Feature',
      geometry: geom,
      properties: {
        ulpin,
        surveyNo,
        district: 'Belagavi',
        taluk: talukObj.name,
        village,
        area: recArea,
        gisArea,
        landUse,
        status,
        riskScore,
        riskLevel,
        owner: parcel.ownerName,
        overlap: hasOverlap,
        areaMismatch: hasAreaMismatch,
      },
    });

    counter++;
  }

  // District 2: Mysuru (35 parcels)
  const mysuruTaluks = [
    { name: 'Mysuru', villages: ['Chamundi Foothills', 'Srirampura', 'Yelwal'] },
    { name: 'Nanjangud', villages: ['Bannur Rural', 'Varuna East'] },
    { name: 'Hunsur', villages: ['Bilikere Agro', 'Rathnapuri'] },
  ];
  const mysuruBaseLng = 76.6394;
  const mysuruBaseLat = 12.2958;
  counter = 201;

  for (let i = 0; i < 35; i++) {
    const talukObj = mysuruTaluks[i % mysuruTaluks.length];
    const village = talukObj.villages[i % talukObj.villages.length];
    const ulpin = `KA-MYS-002-000${counter}`;
    const surveyNo = `${counter}/${String.fromCharCode(65 + (i % 5))}`;

    const row = Math.floor(i / 6);
    const col = i % 6;
    const cLng = mysuruBaseLng + (col * 0.0019) + (Math.sin(i * 1.5) * 0.0003);
    const cLat = mysuruBaseLat + (row * 0.0017) + (Math.cos(i * 1.5) * 0.0002);

    const landUse = landUses[(i + 2) % landUses.length];
    const recArea = +(1.5 + (i * 0.22) % 5.0).toFixed(2);
    const hasAreaMismatch = i % 7 === 0;
    const gisArea = hasAreaMismatch ? +(recArea + 0.38).toFixed(2) : +(recArea - 0.02).toFixed(2);
    const areaDiff = +Math.abs(recArea - gisArea).toFixed(2);

    const hasOwnershipConflict = counter === 208 || counter === 225;
    const hasRegConflict = counter === 215;
    const hasEncumbrance = i % 3 === 0;
    const hasTaxIssue = i % 6 === 2;

    let riskScore = 15;
    const reasons: string[] = [];
    if (hasAreaMismatch) { riskScore += 20; reasons.push('Cadastral polygon GIS boundary deviates from recorded survey extent'); }
    if (hasOwnershipConflict) { riskScore += 25; reasons.push('Partition deed succession dispute pending in Sub-Court'); }
    if (hasRegConflict) { riskScore += 20; reasons.push('Discrepancy in sale deed consideration vs valuation'); }
    if (hasEncumbrance) { riskScore += 10; reasons.push('Registered equitable mortgage with Canara Bank'); }
    if (hasTaxIssue) { riskScore += 5; reasons.push('Urban local body cess non-payment notice issued'); }

    if (riskScore > 100) riskScore = 100;
    let riskLevel = 'LOW';
    if (riskScore > 75) riskLevel = 'CRITICAL';
    else if (riskScore > 50) riskLevel = 'HIGH';
    else if (riskScore > 25) riskLevel = 'MEDIUM';

    let status = 'VERIFIED';
    if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') status = 'RESTRICTED';
    else if (hasOwnershipConflict) status = 'DISPUTED';
    else if (counter % 8 === 0) status = 'PENDING_VERIFICATION';

    const geom = createPolygon(cLng, cLat, 80 + (i % 4) * 8, 70 + (i % 3) * 6);
    const bounds = [
      [cLat - 0.0006, cLng - 0.0007],
      [cLat + 0.0006, cLng + 0.0007],
    ];

    const parcel: ParcelMeta = {
      ulpin,
      surveyNo,
      subDivision: `${(i % 3) + 1}`,
      district: 'Mysuru',
      taluk: talukObj.name,
      village,
      hobli: `${talukObj.name} South`,
      area: recArea,
      gisArea,
      areaDifference: areaDiff,
      landUse,
      status,
      centroidLat: +cLat.toFixed(6),
      centroidLng: +cLng.toFixed(6),
      boundsJson: JSON.stringify(bounds),
      geojsonGeometry: geom,
      riskScore,
      riskLevel,
      riskReasons: reasons,
      hasBoundaryOverlap: false,
      hasAreaMismatch,
      hasOwnershipConflict,
      hasRegistrationConflict: hasRegConflict,
      hasEncumbrance,
      hasTaxIssue,
      ownerName: `Sri ${['Siddaramaiah Urs', 'Krishnaraja Wodeyar', 'Chandrashekhar Murthy', 'Devanur Mahadeva', 'Girija Prasad', 'Sowmya Reddy', 'Raghavendra Rao'][i % 7]}`,
      annualTax: +(5200 + (i * 420)).toFixed(0),
      taxStatus: hasTaxIssue ? 'OVERDUE' : 'PAID',
    };

    parcels.push(parcel);

    geojsonFeatures.push({
      type: 'Feature',
      geometry: geom,
      properties: {
        ulpin,
        surveyNo,
        district: 'Mysuru',
        taluk: talukObj.name,
        village,
        area: recArea,
        gisArea,
        landUse,
        status,
        riskScore,
        riskLevel,
        owner: parcel.ownerName,
        overlap: false,
        areaMismatch: hasAreaMismatch,
      },
    });

    counter++;
  }

  // District 3: Dharwad (30 parcels)
  const dharwadTaluks = [
    { name: 'Hubballi Urban', villages: ['Rayapur', 'Unkal Lake Ward', 'Amargol Techzone'] },
    { name: 'Dharwad', villages: ['Sattur Industrial', 'Kelageri Gram', 'Navalgund Agro'] },
  ];
  const dharwadBaseLng = 75.0078;
  const dharwadBaseLat = 15.4589;
  counter = 301;

  for (let i = 0; i < 30; i++) {
    const talukObj = dharwadTaluks[i % dharwadTaluks.length];
    const village = talukObj.villages[i % talukObj.villages.length];
    const ulpin = `KA-DWD-003-000${counter}`;
    const surveyNo = `${counter}/${String.fromCharCode(65 + (i % 4))}`;

    const row = Math.floor(i / 5);
    const col = i % 5;
    const cLng = dharwadBaseLng + (col * 0.0020) + (Math.cos(i) * 0.0003);
    const cLat = dharwadBaseLat + (row * 0.0018) + (Math.sin(i) * 0.0002);

    const landUse = landUses[(i + 4) % landUses.length];
    const recArea = +(0.8 + (i * 0.3) % 4.2).toFixed(2);
    const hasAreaMismatch = i % 6 === 0;
    const gisArea = hasAreaMismatch ? +(recArea + 0.31).toFixed(2) : +(recArea + 0.01).toFixed(2);
    const areaDiff = +Math.abs(recArea - gisArea).toFixed(2);

    const hasOwnershipConflict = counter === 305;
    const hasRegConflict = counter === 319;
    const hasEncumbrance = i % 4 === 2;
    const hasTaxIssue = i % 5 === 1;

    let riskScore = 18;
    const reasons: string[] = [];
    if (hasAreaMismatch) { riskScore += 20; reasons.push('Physical survey discrepancy with Bhoomi digital cadastral record'); }
    if (hasOwnershipConflict) { riskScore += 25; reasons.push('Adverse possession claim filed by adjacent tenant'); }
    if (hasRegConflict) { riskScore += 20; reasons.push('Unverified power of attorney execution noted'); }
    if (hasEncumbrance) { riskScore += 10; reasons.push('State Bank of India agricultural term loan hypothecation'); }
    if (hasTaxIssue) { riskScore += 5; reasons.push('Non-agricultural assessment tax default'); }

    if (riskScore > 100) riskScore = 100;
    let riskLevel = 'LOW';
    if (riskScore > 75) riskLevel = 'CRITICAL';
    else if (riskScore > 50) riskLevel = 'HIGH';
    else if (riskScore > 25) riskLevel = 'MEDIUM';

    let status = 'VERIFIED';
    if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') status = 'RESTRICTED';
    else if (hasOwnershipConflict) status = 'DISPUTED';
    else if (counter % 7 === 0) status = 'PENDING_VERIFICATION';

    const geom = createPolygon(cLng, cLat, 75 + (i % 4) * 10, 65 + (i % 3) * 10);
    const bounds = [
      [cLat - 0.0006, cLng - 0.0007],
      [cLat + 0.0006, cLng + 0.0007],
    ];

    const parcel: ParcelMeta = {
      ulpin,
      surveyNo,
      subDivision: `${(i % 3) + 1}`,
      district: 'Dharwad',
      taluk: talukObj.name,
      village,
      hobli: `${talukObj.name} North`,
      area: recArea,
      gisArea,
      areaDifference: areaDiff,
      landUse,
      status,
      centroidLat: +cLat.toFixed(6),
      centroidLng: +cLng.toFixed(6),
      boundsJson: JSON.stringify(bounds),
      geojsonGeometry: geom,
      riskScore,
      riskLevel,
      riskReasons: reasons,
      hasBoundaryOverlap: false,
      hasAreaMismatch,
      hasOwnershipConflict,
      hasRegistrationConflict: hasRegConflict,
      hasEncumbrance,
      hasTaxIssue,
      ownerName: `Sri ${['Jagadish Shettar', 'Vinay Kulkarni', 'Pralhad Joshi', 'Shankar Patil', 'Basavaraj Horatti', 'Sudha Murty Foundation'][i % 6]}`,
      annualTax: +(3800 + (i * 320)).toFixed(0),
      taxStatus: hasTaxIssue ? 'OVERDUE' : 'PAID',
    };

    parcels.push(parcel);

    geojsonFeatures.push({
      type: 'Feature',
      geometry: geom,
      properties: {
        ulpin,
        surveyNo,
        district: 'Dharwad',
        taluk: talukObj.name,
        village,
        area: recArea,
        gisArea,
        landUse,
        status,
        riskScore,
        riskLevel,
        owner: parcel.ownerName,
        overlap: false,
        areaMismatch: hasAreaMismatch,
      },
    });

    counter++;
  }

  return { parcels, geojson: { type: 'FeatureCollection', features: geojsonFeatures } };
}

// Generate restriction zones
export function generateRestrictionsGeoJSON() {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [74.4960, 15.8480],
            [74.5050, 15.8480],
            [74.5040, 15.8520],
            [74.4950, 15.8520],
            [74.4960, 15.8480]
          ]]
        },
        properties: {
          id: 'REST-BLG-001',
          name: 'Markandeya River 100m Flood Risk Buffer',
          type: 'Flood Zone',
          district: 'Belagavi',
          severity: 'HIGH',
          regulation: 'Buffer zone under National Disaster Management Authority Guidelines',
          status: 'Review Required'
        }
      },
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [76.6370, 12.2940],
            [76.6450, 12.2940],
            [76.6440, 12.2990],
            [76.6360, 12.2990],
            [76.6370, 12.2940]
          ]]
        },
        properties: {
          id: 'REST-MYS-002',
          name: 'Chamundi Hills Eco-Sensitive Heritage Zone',
          type: 'Heritage Zone',
          district: 'Mysuru',
          severity: 'MEDIUM',
          regulation: 'ASI Heritage buffer zone - Max height 10m',
          status: 'Review Required'
        }
      },
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [75.0060, 15.4570],
            [75.0150, 15.4570],
            [75.0140, 15.4610],
            [75.0050, 15.4610],
            [75.0060, 15.4570]
          ]]
        },
        properties: {
          id: 'REST-DWD-003',
          name: 'Unkal Lake Catchment Conservation Zone',
          type: 'Water Buffer',
          district: 'Dharwad',
          severity: 'HIGH',
          regulation: 'Karnataka Wetland Authority Buffer 30m',
          status: 'Review Required'
        }
      },
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [74.4990, 15.8530],
            [74.5090, 15.8530],
            [74.5080, 15.8550],
            [74.4980, 15.8550],
            [74.4990, 15.8530]
          ]]
        },
        properties: {
          id: 'REST-BLG-004',
          name: 'National Highway 48 Arterial Road Reservation',
          type: 'Road Reservation',
          district: 'Belagavi',
          severity: 'MEDIUM',
          regulation: 'NHAI Corridor reservation 45 meters from centerline',
          status: 'Review Required'
        }
      }
    ]
  };
}

// Generate infrastructure lines
export function generateInfrastructureGeoJSON() {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [74.4940, 15.8490],
            [74.5080, 15.8510],
            [74.5120, 15.8530]
          ]
        },
        properties: {
          name: '66kV Belagavi-Sambra High Tension Power Corridor',
          type: 'Utilities',
          category: 'Electricity Grid',
          status: 'Operational'
        }
      },
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [76.6350, 12.2960],
            [76.6480, 12.2980],
            [76.6520, 12.3010]
          ]
        },
        properties: {
          name: 'MUDA 60ft Peripheral Ring Road Project',
          type: 'Roads',
          category: 'Major Arterial Road',
          status: 'Under Construction'
        }
      },
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [75.0040, 15.4590],
            [75.0160, 15.4600],
            [75.0200, 15.4620]
          ]
        },
        properties: {
          name: 'Hubballi-Dharwad BRTS Feeder Road',
          type: 'Infrastructure',
          category: 'Transit Corridor',
          status: 'Operational'
        }
      }
    ]
  };
}

// Main execution
const dataDir = path.join(__dirname, '..', 'data', 'geojson');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const { parcels, geojson } = generateAllParcels();
fs.writeFileSync(path.join(dataDir, 'parcels.geojson'), JSON.stringify(geojson, null, 2));
fs.writeFileSync(path.join(dataDir, 'restrictions.geojson'), JSON.stringify(generateRestrictionsGeoJSON(), null, 2));
fs.writeFileSync(path.join(dataDir, 'infrastructure.geojson'), JSON.stringify(generateInfrastructureGeoJSON(), null, 2));

console.log(`Generated ${parcels.length} parcels in data/geojson/parcels.geojson`);
console.log(`Generated restriction zones in data/geojson/restrictions.geojson`);
console.log(`Generated infrastructure in data/geojson/infrastructure.geojson`);
