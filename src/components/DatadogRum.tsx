'use client';

import { useEffect } from 'react';
import { datadogRum } from '@datadog/browser-rum';

let initialized = false;

export function DatadogRum() {
  useEffect(() => {
    if (initialized) return;
    initialized = true;

    datadogRum.init({
      applicationId: '4877e9d0-7e2a-4e79-a203-3a604ab9544c',
      clientToken: 'pubc012fe1b1a111a2ba595f05530af85a4',
      site: 'us5.datadoghq.com',
      service: 'loterias-frontend',
      env: 'prod',
      version: '0.0.1',
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
