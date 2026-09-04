import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { ModuleEnabledGuard } from '../auth/guards/module-enabled.guard.js';
import { RequireModule, RequirePermissions, CurrentUser } from '../auth/guards/decorators.js';
import type { AuthenticatedUser } from '../auth/entity.js';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard, ModuleEnabledGuard)
@RequireModule('finance')
export class FinanceController {
  @Get(['finance/records', 'api/finance/records'])
  @RequirePermissions('finance.view')
  getRecords(@CurrentUser() user: AuthenticatedUser) {
    return {
      module: 'finance',
      status: 'active',
      tenant_id: user.tenant_id,
      timestamp: new Date().toISOString(),
      summary: {
        currency: 'USD',
        generalLedgerBalance: 2458000.0,
        accountsPayable: 142000.0,
        accountsReceivable: 389000.0,
      },
      message: 'Financial general ledger accessed securely with valid authorization and enabled module.',
    };
  }
}
