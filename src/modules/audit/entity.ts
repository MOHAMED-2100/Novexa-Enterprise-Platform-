export interface AuditLogEntity {
  id: string;
  tenant_id: string;
  user_id?: string | null;
  action: string;
  entity_name: string;
  entity_id?: string | null;
  before_state?: any;
  after_state?: any;
  ip_address?: string | null;
  created_at: Date;
}

export interface CreateAuditLogDto {
  tenant_id: string;
  user_id?: string | null;
  action: string;
  entity_name: string;
  entity_id?: string | null;
  before_state?: any;
  after_state?: any;
  ip_address?: string | null;
}
