import { NextResponse } from 'next/server';

export interface ApiResponseOptions {
  success: boolean;
  data?: any;
  message: string;
  statusCode?: number;
  metadata?: {
    source?: string;
    timestamp?: string;
    [key: string]: any;
  };
}

export function createApiResponse({
  success,
  data = null,
  message,
  statusCode = 200,
  metadata = {},
}: ApiResponseOptions) {
  const payload = {
    success,
    data,
    message,
    metadata: {
      source: 'DEMO — NOT AN OFFICIAL GOVERNMENT LAND RECORD',
      timestamp: new Date().toISOString(),
      ...metadata,
    },
  };

  return NextResponse.json(payload, { status: statusCode });
}

export function apiSuccess(data: any, message = 'Operation completed successfully', statusCode = 200, metadata = {}) {
  return createApiResponse({
    success: true,
    data,
    message,
    statusCode,
    metadata,
  });
}

export function apiError(message: string, statusCode = 400, data: any = null) {
  return createApiResponse({
    success: false,
    data,
    message,
    statusCode,
  });
}
