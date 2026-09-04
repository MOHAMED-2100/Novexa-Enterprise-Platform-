export interface ModuleEntity {
  code: string;
  name: string;
  group: string;
  depends_on: string[];
  status: 'active' | 'inactive' | 'pending';
  created_at: Date | string;
  updated_at: Date | string;
}

export interface RegisterModuleDto {
  code: string;
  name: string;
  group: string;
  depends_on?: string[];
  status?: 'active' | 'inactive' | 'pending';
}
