'use client';

import { useEffect } from 'react';
import { datadogRum } from '@datadog/browser-rum';

let initialized = false;

export function DatadogRum() {
  useEffect(() => {
    if (initialized) return;
    if (process.env.NODE_ENV !== 'production') return;

    const applicationId = process.env.NEXT_PUBLIC_DD_APPLICATION_ID;
    const clientToken = process.env.NEXT_PUBLIC_DD_CLIENT_TOKEN;
    if (!applicationId || !clientToken) return;

    initialized = true;

    datadogRum.init({
      applicationId,
      clientToken,
      site: process.env.NEXT_PUBLIC_DD_SITE || 'us5.datadoghq.com',
      service: 'loterias-frontend',
      env: process.env.NEXT_PUBLIC_DD_ENV || 'prod',
      version: process.env.NEXT_PUBLIC_DD_VERSION || '0.0.1',
      sessionSampleRate: 100,
      sessionReplaySampleRate: 20,
      trackBfcacheViews: true,
      trackUserInteractions: true,
      trackResources: true,
      trackLongTasks: true,
      defaultPrivacyLevel: 'mask-user-input',
    });
  }, []);

  return null;
}
