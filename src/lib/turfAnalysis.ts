import * as turf from '@turf/turf';

/**
 * Converts square meters to Acres (1 Acre = 4046.8564224 square meters)
 */
export function sqMetersToAcres(sqMeters: number): number {
  return +(sqMeters / 4046.8564224).toFixed(2);
}

/**
 * Converts square meters to Guntas (1 Acre = 40 Guntas; 1 Gunta ~ 101.17 sq.m)
 */
export function sqMetersToGuntas(sqMeters: number): number {
  return +((sqMeters / 4046.8564224) * 40).toFixed(1);
}

/**
 * Calculates geodesic area of GeoJSON Polygon or MultiPolygon using Turf.js
 */
export function calculateArea(featureOrGeometry: any): { sqMeters: number; acres: number; guntas: number } {
  try {
    const areaSqM = turf.area(featureOrGeometry);
    return {
      sqMeters: +areaSqM.toFixed(1),
      acres: sqMetersToAcres(areaSqM),
      guntas: sqMetersToGuntas(areaSqM),
    };
  } catch (err) {
    console.error('Turf area calculation error:', err);
    return { sqMeters: 0, acres: 0, guntas: 0 };
  }
}

/**
 * Calculates centroid of a polygon feature
 */
export function calculateCentroid(featureOrGeometry: any): [number, number] | null {
  try {
    const centroidFeature = turf.centroid(featureOrGeometry);
    const [lng, lat] = centroidFeature.geometry.coordinates;
    return [lat, lng];
  } catch (err) {
    console.error('Turf centroid error:', err);
    return null;
  }
}

/**
 * Measures distance between two points in meters and kilometers
 */
export function measureDistance(
  coord1: [number, number], // [lat, lng]
  coord2: [number, number]  // [lat, lng]
): { meters: number; kilometers: number; feet: number } {
  try {
    const from = turf.point([coord1[1], coord1[0]]);
    const to = turf.point([coord2[1], coord2[0]]);
    const distKm = turf.distance(from, to, { units: 'kilometers' });
    const distMeters = distKm * 1000;
    return {
      meters: +distMeters.toFixed(1),
      kilometers: +distKm.toFixed(3),
      feet: +(distMeters * 3.28084).toFixed(1),
    };
  } catch (err) {
    console.error('Turf distance error:', err);
    return { meters: 0, kilometers: 0, feet: 0 };
  }
}

/**
 * Detects boundary overlap (intersection) between two parcel polygon features.
 */
export function detectBoundaryOverlap(
  featureA: any,
  featureB: any
): { hasOverlap: boolean; overlapAreaSqM: number; intersectionGeometry: any } {
  try {
    const getFeature = (item: any) => {
      if (item.type === 'Feature') return item;
      if (item.type === 'Polygon') return turf.polygon(item.coordinates);
      if (item.geometry && item.geometry.type === 'Polygon') return turf.polygon(item.geometry.coordinates);
      return item;
    };

    const featA = getFeature(featureA);
    const featB = getFeature(featureB);

    let intersection: any = null;
    try {
      // @ts-ignore
      intersection = turf.intersect(turf.featureCollection([featA, featB]));
    } catch (e) {
      try {
        // @ts-ignore
        intersection = turf.intersect(featA, featB);
      } catch {}
    }

    if (intersection && (intersection.geometry || intersection.type === 'Feature')) {
      const areaSqM = turf.area(intersection);
      if (areaSqM > 0.1) {
        return {
          hasOverlap: true,
          overlapAreaSqM: +areaSqM.toFixed(1),
          intersectionGeometry: intersection.geometry || intersection,
        };
      }
    }
  } catch (err) {
    // If polygons don't intersect or are adjacent with shared boundary
  }

  return {
    hasOverlap: false,
    overlapAreaSqM: 0,
    intersectionGeometry: null,
  };
}

/**
 * Scans an array of GeoJSON parcel features for all overlapping pairs
 */
export function scanAllParcelsForOverlaps(features: any[]): Array<{
  ulpinA: string;
  ulpinB: string;
  overlapSqM: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}> {
  const overlaps: Array<{
    ulpinA: string;
    ulpinB: string;
    overlapSqM: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
  }> = [];

  for (let i = 0; i < features.length; i++) {
    for (let j = i + 1; j < features.length; j++) {
      const fA = features[i];
      const fB = features[j];

      // Quick bounding box check
      const bboxA = turf.bbox(fA);
      const bboxB = turf.bbox(fB);

      // Check if bounding boxes overlap
      const noOverlap =
        bboxA[2] < bboxB[0] ||
        bboxA[0] > bboxB[2] ||
        bboxA[3] < bboxB[1] ||
        bboxA[1] > bboxB[3];

      if (!noOverlap) {
        const res = detectBoundaryOverlap(fA, fB);
        if (res.hasOverlap && res.overlapAreaSqM > 1) {
          overlaps.push({
            ulpinA: fA.properties?.ulpin || `Parcel-${i}`,
            ulpinB: fB.properties?.ulpin || `Parcel-${j}`,
            overlapSqM: res.overlapAreaSqM,
            severity: res.overlapAreaSqM > 10 ? 'HIGH' : (res.overlapAreaSqM > 4 ? 'MEDIUM' : 'LOW'),
          });
        }
      }
    }
  }

  return overlaps;
}
