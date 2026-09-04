export interface DatabaseHealth {
  connected: boolean;
  status: 'connected' | 'disconnected';
  latencyMs: number;
  serverVersion?: string;
  error?: string;
  connectionTarget: string;
}

export interface ModulesHealth {
  tableExists: boolean;
  totalRegistered: number;
}

export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  language: string;
  localizedMessage: string;
  database: DatabaseHealth;
  modules: ModulesHealth;
  httpStatus?: number;
}

export interface ModuleItem {
  code: string;
  name: string;
  group: string;
  depends_on: string[];
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  updated_at: string;
}

export interface ModulesResponse {
  data: ModuleItem[];
  source: 'database' | 'fallback';
}
