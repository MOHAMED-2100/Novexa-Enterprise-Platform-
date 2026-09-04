export interface TenantModuleStatus {
  code: string;
  name: string;
  group: string;
  depends_on: string[];
  status: string;
  isEnabled: boolean;
  enabledAt?: Date | null;
  enabledBy?: string | null;
}

export interface ModuleOperationResult {
  success: boolean;
  message: string;
  tenant_id: string;
  module_code: string;
}
