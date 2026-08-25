import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service.js';
import { JwtAuthGuard, type JwtPayload } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import {
  CreateOrganizationSchema,
  UpdateOrganizationSchema,
  InviteMemberSchema,
} from '@lensrecall/shared';

@ApiTags('organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly orgService: OrganizationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create an organization' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() body: typeof CreateOrganizationSchema._type,
  ) {
    const validated = CreateOrganizationSchema.parse(body);
    const org = await this.orgService.create(user.sub, validated);
    return { success: true, data: org };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization details' })
  async getById(
    @CurrentUser() user: JwtPayload,
    @Param('id') orgId: string,
  ) {
    const org = await this.orgService.getById(orgId, user.sub);
    return { success: true, data: org };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update organization details' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') orgId: string,
    @Body() body: typeof UpdateOrganizationSchema._type,
  ) {
    const validated = UpdateOrganizationSchema.parse(body);
    const updated = await this.orgService.update(orgId, user.sub, validated);
    return { success: true, data: updated };
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'List organization members' })
  async listMembers(
    @CurrentUser() user: JwtPayload,
    @Param('id') orgId: string,
  ) {
    const members = await this.orgService.listMembers(orgId, user.sub);
    return { success: true, data: members };
  }

  @Post(':id/invitations')
  @ApiOperation({ summary: 'Invite a member to the organization' })
  async inviteMember(
    @CurrentUser() user: JwtPayload,
    @Param('id') orgId: string,
    @Body() body: typeof InviteMemberSchema._type,
  ) {
    const validated = InviteMemberSchema.parse(body);
    const invite = await this.orgService.inviteMember(orgId, user.sub, validated);
    return { success: true, data: invite };
  }

  @Post('invitations/:token/accept')
  @ApiOperation({ summary: 'Accept an invitation' })
  async acceptInvitation(
    @CurrentUser() user: JwtPayload,
    @Param('token') token: string,
  ) {
    const result = await this.orgService.acceptInvitation(token, user.sub);
    return { success: true, data: result };
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove a member from the organization' })
  async removeMember(
    @CurrentUser() user: JwtPayload,
    @Param('id') orgId: string,
    @Param('userId') targetUserId: string,
  ) {
    const result = await this.orgService.removeMember(orgId, user.sub, targetUserId);
    return { success: true, data: result };
  }

  @Patch(':id/members/:userId/role')
  @ApiOperation({ summary: 'Change member role' })
  async updateRole(
    @CurrentUser() user: JwtPayload,
    @Param('id') orgId: string,
    @Param('userId') targetUserId: string,
    @Body() body: { role: string },
  ) {
    const result = await this.orgService.updateMemberRole(
      orgId,
      user.sub,
      targetUserId,
      body.role,
    );
    return { success: true, data: result };
  }
}
