import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service.js';
import { JwtAuthGuard, type JwtPayload } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get global platform-wide statistics, revenue, and infrastructure telemetry' })
  async getOverview() {
    const result = await this.adminService.getPlatformOverview();
    return { success: true, data: result };
  }

  @Get('organizations')
  @ApiOperation({ summary: 'List all studios and organizations across the platform' })
  async listOrganizations(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const result = await this.adminService.listAllOrganizations({
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });
    return { success: true, data: result };
  }

  @Patch('organizations/:id/status')
  @ApiOperation({ summary: 'Suspend or activate a studio organization' })
  async updateStatus(
    @Param('id') orgId: string,
    @Body() body: { status: 'ACTIVE' | 'SUSPENDED' },
    @CurrentUser() user: JwtPayload,
  ) {
    const result = await this.adminService.updateOrganizationStatus(
      orgId,
      body.status,
      user.sub,
    );
    return { success: true, data: result };
  }
}
