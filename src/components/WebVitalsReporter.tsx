'use client';

import { useEffect } from 'react';
import { onCLS, onINP, onLCP, onFCP, onTTFB, type Metric } from 'web-vitals';
import logger from '@/lib/logger';

function sendMetric(metric: Metric) {
  const body = {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
  };

  // Log metrics client-side; web vitals are also available via Chrome DevTools
  logger.info({ webVital: body }, `Web Vital: ${metric.name} = ${metric.value} (${metric.rating})`);
}

export function WebVitalsReporter() {
  useEffect(() => {
    onCLS(sendMetric);
    onINP(sendMetric);
    onLCP(sendMetric);
    onFCP(sendMetric);
    onTTFB(sendMetric);
  }, []);

  return null;
}
