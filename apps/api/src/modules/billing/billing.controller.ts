import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service.js';
import { JwtAuthGuard, type JwtPayload } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { CreateCheckoutSessionSchema } from '@lensrecall/shared';

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('subscription')
  @ApiOperation({ summary: 'Get current organization subscription details and usage stats' })
  async getSubscription(@CurrentUser() user: JwtPayload) {
    const orgId = user.organizationId;
    if (!orgId) throw new Error('User has no active organization');

    const result = await this.billingService.getSubscriptionDetails(orgId);
    return { success: true, data: result };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('checkout-session')
  @ApiOperation({ summary: 'Create Stripe checkout session for plan upgrade' })
  async createCheckoutSession(
    @CurrentUser() user: JwtPayload,
    @Body() body: typeof CreateCheckoutSessionSchema._type,
  ) {
    const validated = CreateCheckoutSessionSchema.parse(body);
    const orgId = user.organizationId;
    if (!orgId) throw new Error('User has no active organization');

    const result = await this.billingService.createCheckoutSession(
      orgId,
      user.sub,
      validated,
    );
    return { success: true, data: result };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('portal-session')
  @ApiOperation({ summary: 'Create Stripe customer billing portal session' })
  async createPortalSession(@CurrentUser() user: JwtPayload) {
    const orgId = user.organizationId;
    if (!orgId) throw new Error('User has no active organization');

    const result = await this.billingService.createBillingPortalSession(orgId);
    return { success: true, data: result };
  }

  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Stripe webhook receiver' })
  async handleWebhook(@Body() payload: any) {
    return { received: true };
  }
}
