import { AwsServiceOption, ComponentType } from './types';

export const SERVICE_CATALOG: AwsServiceOption[] = [

  // Load Balancer
  {
    id: 'alb',
    name: 'AWS ALB',
    provider: 'AWS',
    componentType: 'load_balancer',
    baseCostPerHour: 0.0225, // $16.20/month base + LCU charges
    baseLatencyMs: 2,
    maxRps: 100000,
    maxThroughputMBps: 3000,
    description: 'Application Load Balancer with layer 7 routing, path-based routing',
  },
  {
    id: 'nlb',
    name: 'AWS NLB',
    provider: 'AWS',
    componentType: 'load_balancer',
    baseCostPerHour: 0.0225,
    baseLatencyMs: 0.1,
    maxRps: 1000000,
    maxThroughputMBps: 10000,
    description: 'Network Load Balancer with ultra-low latency, layer 4',
  },
  {
    id: 'nginx',
    name: 'Nginx (self-managed)',
    provider: 'Generic',
    componentType: 'load_balancer',
    baseCostPerHour: 0.05, // cost of EC2 instance running nginx
    baseLatencyMs: 1,
    maxRps: 50000,
    maxThroughputMBps: 1000,
    description: 'Self-managed Nginx reverse proxy on EC2',
  },

  // API Server
  {
    id: 'ec2_t3_medium',
    name: 'AWS EC2 t3.medium',
    provider: 'AWS',
    componentType: 'api_server',
    baseCostPerHour: 0.0416,
    baseLatencyMs: 15,
    maxRps: 1000,
    maxThroughputMBps: 600,
    description: '2 vCPU, 4GB RAM — good for low-medium traffic APIs',
  },
  {
    id: 'ec2_c5_xlarge',
    name: 'AWS EC2 c5.xlarge',
    provider: 'AWS',
    componentType: 'api_server',
    baseCostPerHour: 0.17,
    baseLatencyMs: 10,
    maxRps: 5000,
    maxThroughputMBps: 1250,
    description: '4 vCPU, 8GB RAM — compute optimized for high-traffic APIs',
  },
  {
    id: 'ec2_c5_4xlarge',
    name: 'AWS EC2 c5.4xlarge',
    provider: 'AWS',
    componentType: 'api_server',
    baseCostPerHour: 0.68,
    baseLatencyMs: 5,
    maxRps: 20000,
    maxThroughputMBps: 5000,
    description: '16 vCPU, 32GB RAM — high-performance compute',
  },
  {
    id: 'lambda',
    name: 'AWS Lambda',
    provider: 'AWS',
    componentType: 'api_server',
    baseCostPerHour: 0.00, // pay per invocation: $0.20/million + compute
    baseLatencyMs: 50, // cold start averaged in
    maxRps: 3000, // default concurrency limit
    maxThroughputMBps: 500,
    description: 'Serverless compute — pay per request, auto-scales, cold starts',
  },
  {
    id: 'fargate',
    name: 'AWS Fargate',
    provider: 'AWS',
    componentType: 'api_server',
    baseCostPerHour: 0.05,
    baseLatencyMs: 12,
    maxRps: 2000,
    maxThroughputMBps: 500,
    description: 'Serverless containers — no server management',
  },

  // Cache
  {
    id: 'elasticache_redis',
    name: 'AWS ElastiCache (Redis)',
    provider: 'AWS',
    componentType: 'cache',
    baseCostPerHour: 0.068, // cache.r6g.large
    baseLatencyMs: 0.5,
    maxRps: 100000,
    maxThroughputMBps: 1500,
    description: 'Managed Redis — sub-millisecond latency, up to 500 nodes',
  },
  {
    id: 'elasticache_memcached',
    name: 'AWS ElastiCache (Memcached)',
    provider: 'AWS',
    componentType: 'cache',
    baseCostPerHour: 0.047,
    baseLatencyMs: 0.4,
    maxRps: 150000,
    maxThroughputMBps: 1500,
    description: 'Managed Memcached — simple key-value caching',
  },
  {
    id: 'redis_self',
    name: 'Redis (self-managed)',
    provider: 'Generic',
    componentType: 'cache',
    baseCostPerHour: 0.05,
    baseLatencyMs: 0.3,
    maxRps: 120000,
    maxThroughputMBps: 1000,
    description: 'Self-managed Redis on EC2',
  },

  // Database
  {
    id: 'rds_mysql',
    name: 'AWS RDS MySQL',
    provider: 'AWS',
    componentType: 'database',
    baseCostPerHour: 0.171, // db.r5.large
    baseLatencyMs: 5,
    maxRps: 10000,
    maxThroughputMBps: 600,
    description: 'Managed MySQL — Multi-AZ, automated backups, read replicas',
  },
  {
    id: 'rds_postgres',
    name: 'AWS RDS PostgreSQL',
    provider: 'AWS',
    componentType: 'database',
    baseCostPerHour: 0.185,
    baseLatencyMs: 5,
    maxRps: 10000,
    maxThroughputMBps: 600,
    description: 'Managed PostgreSQL — ACID compliant, extensible',
  },
  {
    id: 'aurora',
    name: 'AWS Aurora',
    provider: 'AWS',
    componentType: 'database',
    baseCostPerHour: 0.29,
    baseLatencyMs: 3,
    maxRps: 50000,
    maxThroughputMBps: 2000,
    description: 'MySQL/PostgreSQL compatible — 5x throughput, auto-scaling storage',
  },
  {
    id: 'dynamodb',
    name: 'AWS DynamoDB',
    provider: 'AWS',
    componentType: 'database',
    baseCostPerHour: 0.00065, // per WCU, on-demand pricing
    baseLatencyMs: 2,
    maxRps: 40000, // per table partition
    maxThroughputMBps: 1000,
    description: 'Fully managed NoSQL — single-digit ms latency at any scale',
  },
  {
    id: 'mongodb_atlas',
    name: 'MongoDB Atlas M30',
    provider: 'Generic',
    componentType: 'database',
    baseCostPerHour: 0.54,
    baseLatencyMs: 4,
    maxRps: 15000,
    maxThroughputMBps: 800,
    description: 'Managed MongoDB — flexible schema, horizontal scaling',
  },

  // Message Queue
  {
    id: 'sqs',
    name: 'AWS SQS',
    provider: 'AWS',
    componentType: 'message_queue',
    baseCostPerHour: 0.00004, // $0.40/million requests
    baseLatencyMs: 5,
    maxRps: 30000,
    maxThroughputMBps: 256,
    description: 'Fully managed message queue — unlimited throughput, at-least-once delivery',
  },
  {
    id: 'sns',
    name: 'AWS SNS',
    provider: 'AWS',
    componentType: 'message_queue',
    baseCostPerHour: 0.00005,
    baseLatencyMs: 3,
    maxRps: 30000,
    maxThroughputMBps: 256,
    description: 'Pub/sub messaging — fan-out to multiple subscribers',
  },
  {
    id: 'kafka_msk',
    name: 'AWS MSK (Kafka)',
    provider: 'AWS',
    componentType: 'message_queue',
    baseCostPerHour: 0.21, // kafka.m5.large
    baseLatencyMs: 2,
    maxRps: 100000,
    maxThroughputMBps: 3000,
    description: 'Managed Apache Kafka — high-throughput streaming platform',
  },
  {
    id: 'rabbitmq',
    name: 'AWS MQ (RabbitMQ)',
    provider: 'AWS',
    componentType: 'message_queue',
    baseCostPerHour: 0.13,
    baseLatencyMs: 3,
    maxRps: 20000,
    maxThroughputMBps: 500,
    description: 'Managed RabbitMQ — flexible routing, multiple protocols',
  },

  // Worker / Compute
  {
    id: 'ec2_worker',
    name: 'AWS EC2 Worker (c5.2xlarge)',
    provider: 'AWS',
    componentType: 'worker',
    baseCostPerHour: 0.34,
    baseLatencyMs: 100,
    maxRps: 500,
    maxThroughputMBps: 2500,
    description: '8 vCPU, 16GB RAM — background job processing',
  },
  {
    id: 'lambda_worker',
    name: 'AWS Lambda Worker',
    provider: 'AWS',
    componentType: 'worker',
    baseCostPerHour: 0.0,
    baseLatencyMs: 200,
    maxRps: 1000,
    maxThroughputMBps: 500,
    description: 'Serverless worker — event-driven processing',
  },

  // Notification
  {
    id: 'ses',
    name: 'AWS SES',
    provider: 'AWS',
    componentType: 'notification_service',
    baseCostPerHour: 0.0001,
    baseLatencyMs: 100,
    maxRps: 200,
    maxThroughputMBps: 10,
    description: 'Email sending service — transactional and bulk emails',
  },
  {
    id: 'push_sns',
    name: 'AWS SNS (Push)',
    provider: 'AWS',
    componentType: 'notification_service',
    baseCostPerHour: 0.00005,
    baseLatencyMs: 50,
    maxRps: 30000,
    maxThroughputMBps: 100,
    description: 'Push notifications to mobile devices, SMS, email',
  },

  // Rate Limiter
  {
    id: 'rate_limiter_generic',
    name: 'Rate Limiter Middleware',
    provider: 'Generic',
    componentType: 'rate_limiter',
    baseCostPerHour: 0.05, // EC2 t3.small running rate limiter service
    baseLatencyMs: 1, // sub-ms overhead per request
    maxRps: 50000,
    maxThroughputMBps: 500,
    description: 'In-process rate limiting middleware — enforces request limits per user/IP using configurable algorithms',
  },
  {
    id: 'rate_limiter_redis',
    name: 'Redis-backed Rate Limiter',
    provider: 'Generic',
    componentType: 'rate_limiter',
    baseCostPerHour: 0.118, // EC2 t3.small + ElastiCache cache.t4g.small
    baseLatencyMs: 2, // includes Redis round-trip
    maxRps: 100000,
    maxThroughputMBps: 1000,
    description: 'Distributed rate limiter using Redis for shared counters — consistent across multiple instances',
  },

  // Redis Counter (dedicated for rate limiting)
  {
    id: 'redis_counter',
    name: 'Redis Counter (ElastiCache t4g.small)',
    provider: 'AWS',
    componentType: 'cache',
    baseCostPerHour: 0.034, // cache.t4g.small on-demand
    baseLatencyMs: 0.3,
    maxRps: 200000,
    maxThroughputMBps: 1000,
    description: 'Dedicated Redis for rate limit counters — INCR + EXPIRE per request. $0.034/hr (~$24.82/mo)',
  },

  // Client (placeholder)
  {
    id: 'web_client',

    name: 'Web/Mobile Client',
    provider: 'Generic',
    componentType: 'client',
    baseCostPerHour: 0,
    baseLatencyMs: 0,
    maxRps: Infinity,
    maxThroughputMBps: Infinity,
    description: 'User devices — browsers, mobile apps, smart TVs',
  },
];

export function getServicesForType(type: ComponentType): AwsServiceOption[] {
  return SERVICE_CATALOG.filter((s) => s.componentType === type);
}

export function getServiceById(id: string): AwsServiceOption | undefined {
  return SERVICE_CATALOG.find((s) => s.id === id);
}

export const COMPONENT_DEFAULTS: Record<ComponentType, string> = {
  client: 'web_client',
  load_balancer: 'alb',
  api_server: 'ec2_c5_xlarge',
  cache: 'elasticache_redis',
  database: 'rds_postgres',
  message_queue: 'sqs',
  worker: 'ec2_worker',
  notification_service: 'push_sns',
  rate_limiter: 'rate_limiter_redis',
};

export const COMPONENT_LABELS: Record<ComponentType, string> = {
  client: 'Client',
  load_balancer: 'Load Balancer',
  api_server: 'API Server',
  cache: 'Cache',
  database: 'Database',
  message_queue: 'Message Queue',
  worker: 'Worker',
  notification_service: 'Notification Service',
  rate_limiter: 'Rate Limiter',
};

export const COMPONENT_COLORS: Record<ComponentType, string> = {
  client: '#6366f1',
  load_balancer: '#10b981',
  api_server: '#f59e0b',
  cache: '#ef4444',
  database: '#3b82f6',
  message_queue: '#ec4899',
  worker: '#f97316',
  notification_service: '#84cc16',
  rate_limiter: '#dc2626',
};
