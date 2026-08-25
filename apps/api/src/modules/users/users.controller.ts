import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { JwtAuthGuard, type JwtPayload } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UpdateUserSchema } from '@lensrecall/shared';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile with memberships' })
  async getMe(@CurrentUser() user: JwtPayload) {
    const profile = await this.usersService.getProfile(user.sub);
    return { success: true, data: profile };
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update user profile' })
  async updateMe(
    @CurrentUser() user: JwtPayload,
    @Body() body: typeof UpdateUserSchema._type,
  ) {
    const validated = UpdateUserSchema.parse(body);
    const updated = await this.usersService.updateProfile(user.sub, validated);
    return { success: true, data: updated };
  }

  @Post('me/change-password')
  @ApiOperation({ summary: 'Change user password' })
  async changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    const result = await this.usersService.changePassword(
      user.sub,
      body.currentPassword,
      body.newPassword,
    );
    return { success: true, data: result };
  }
}
