import { DesignPreset } from './types';

export const PRESETS: DesignPreset[] = [
  {
    id: 'url-shortener',
    name: 'URL Shortener',
    description: 'Shorten long URLs and redirect via short codes',
    simulationParams: {
      concurrentUsers: 1000,
      requestsPerSecPerUser: 0.08,
      payloadSizeMB: 0.001,
      simulationDurationSeconds: 120,
      loadProfile: 'constant' as const,
      spikeFrequency: 3,
      spikeIntensity: 3,
    },
    nodes: [
      {
        id: 'client',
        type: 'infra',
        position: { x: 400, y: 0 },
        data: {
          label: 'Client',
          componentType: 'client',
          config: { serviceId: 'web_client' },
        },
      },
      {
        id: 'lb',
        type: 'infra',
        position: { x: 400, y: 150 },
        data: {
          label: 'Load Balancer',
          componentType: 'load_balancer',
          config: { serviceId: 'alb' },
        },
      },
      {
        id: 'api1',
        type: 'infra',
        position: { x: 250, y: 300 },
        data: {
          label: 'API Server 1',
          componentType: 'api_server',
          config: { serviceId: 'ec2_c5_xlarge' },
        },
      },
      {
        id: 'api2',
        type: 'infra',
        position: { x: 400, y: 300 },
        data: {
          label: 'API Server 2',
          componentType: 'api_server',
          config: { serviceId: 'ec2_c5_xlarge' },
        },
      },
      {
        id: 'api3',
        type: 'infra',
        position: { x: 550, y: 300 },
        data: {
          label: 'API Server 3',
          componentType: 'api_server',
          config: { serviceId: 'ec2_c5_xlarge' },
        },
      },
      {
        id: 'cache1',
        type: 'infra',
        position: { x: 300, y: 450 },
        data: {
          label: 'URL Cache 1',
          componentType: 'cache',
          config: { serviceId: 'elasticache_redis', cacheHitRate: 0.85 },
        },
      },
      {
        id: 'cache2',
        type: 'infra',
        position: { x: 500, y: 450 },
        data: {
          label: 'URL Cache 2',
          componentType: 'cache',
          config: { serviceId: 'elasticache_redis', cacheHitRate: 0.85 },
        },
      },
      {
        id: 'db',
        type: 'infra',
        position: { x: 400, y: 600 },
        data: {
          label: 'URL Database',
          componentType: 'database',
          config: { serviceId: 'dynamodb' },
        },
      },
    ],
    edges: [
      { id: 'e-client-lb', source: 'client', target: 'lb' },
      { id: 'e-lb-api1', source: 'lb', target: 'api1', animated: true },
      { id: 'e-lb-api2', source: 'lb', target: 'api2', animated: true },
      { id: 'e-lb-api3', source: 'lb', target: 'api3', animated: true },
      { id: 'e-api1-cache1', source: 'api1', target: 'cache1' },
      { id: 'e-api2-cache1', source: 'api2', target: 'cache1' },
      { id: 'e-api3-cache2', source: 'api3', target: 'cache2' },
      { id: 'e-cache1-db', source: 'cache1', target: 'db' },
      { id: 'e-cache2-db', source: 'cache2', target: 'db' },
    ],
  }
];
