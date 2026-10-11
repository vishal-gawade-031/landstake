import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const layer = searchParams.get('layer') || 'parcels';

    let filename = 'parcels.geojson';
    if (layer === 'restrictions') filename = 'restrictions.geojson';
    if (layer === 'infrastructure') filename = 'infrastructure.geojson';

    const filePath = path.join(process.cwd(), 'data', 'geojson', filename);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: `Layer ${layer} not found` }, { status: 404 });
    }

    const data = fs.readFileSync(filePath, 'utf-8');
    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/geo+json',
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (error: any) {
    console.error('Error reading GeoJSON:', error);
    return NextResponse.json({ error: 'Failed to read GeoJSON layer' }, { status: 500 });
  }
}
