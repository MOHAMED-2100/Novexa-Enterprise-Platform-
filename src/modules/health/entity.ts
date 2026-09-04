export interface DatabaseHealthEntity {
  connected: boolean;
  status: 'connected' | 'disconnected';
  latencyMs: number;
  serverVersion?: string;
  error?: string;
  connectionTarget: string;
}

export interface ModulesHealthEntity {
  tableExists: boolean;
  totalRegistered: number;
}

export interface HealthStatusEntity {
  status: 'ok' | 'error';
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  language: string;
  localizedMessage: string;
  database: DatabaseHealthEntity;
  modules: ModulesHealthEntity;
}
