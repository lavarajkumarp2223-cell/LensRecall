import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EventsService } from './events.service.js';
import { JwtAuthGuard, type JwtPayload } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import {
  CreateEventSchema,
  UpdateEventSchema,
} from '@lensrecall/shared';

@ApiTags('events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new event' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() body: typeof CreateEventSchema._type,
  ) {
    const validated = CreateEventSchema.parse(body);
    const orgId = user.organizationId;
    if (!orgId) {
      throw new Error('User has no active organization');
    }
    const event = await this.eventsService.create(orgId, user.sub, validated);
    return { success: true, data: event };
  }

  @Get()
  @ApiOperation({ summary: 'List all events for current organization' })
  async list(
    @CurrentUser() user: JwtPayload,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const orgId = user.organizationId;
    if (!orgId) return { success: true, data: [] };

    const events = await this.eventsService.list(orgId, { search, status });
    return { success: true, data: events };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event details by ID' })
  async getById(
    @CurrentUser() user: JwtPayload,
    @Param('id') eventId: string,
  ) {
    const orgId = user.organizationId;
    if (!orgId) throw new Error('User has no active organization');

    const event = await this.eventsService.getById(eventId, orgId);
    return { success: true, data: event };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update event settings' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') eventId: string,
    @Body() body: typeof UpdateEventSchema._type,
  ) {
    const validated = UpdateEventSchema.parse(body);
    const orgId = user.organizationId;
    if (!orgId) throw new Error('User has no active organization');

    const updated = await this.eventsService.update(eventId, orgId, user.sub, validated);
    return { success: true, data: updated };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete event and all collections' })
  async delete(
    @CurrentUser() user: JwtPayload,
    @Param('id') eventId: string,
  ) {
    const orgId = user.organizationId;
    if (!orgId) throw new Error('User has no active organization');

    const result = await this.eventsService.delete(eventId, orgId, user.sub);
    return { success: true, data: result };
  }

  @Post(':id/photographers')
  @ApiOperation({ summary: 'Assign photographer to event' })
  async addPhotographer(
    @CurrentUser() user: JwtPayload,
    @Param('id') eventId: string,
    @Body() body: { userId: string; canUpload?: boolean; canDelete?: boolean },
  ) {
    const orgId = user.organizationId;
    if (!orgId) throw new Error('User has no active organization');

    const result = await this.eventsService.addPhotographer(
      eventId,
      orgId,
      body.userId,
      body,
    );
    return { success: true, data: result };
  }

  @Delete(':id/photographers/:userId')
  @ApiOperation({ summary: 'Remove photographer from event' })
  async removePhotographer(
    @CurrentUser() user: JwtPayload,
    @Param('id') eventId: string,
    @Param('userId') targetUserId: string,
  ) {
    const orgId = user.organizationId;
    if (!orgId) throw new Error('User has no active organization');

    const result = await this.eventsService.removePhotographer(
      eventId,
      orgId,
      targetUserId,
    );
    return { success: true, data: result };
  }
}
