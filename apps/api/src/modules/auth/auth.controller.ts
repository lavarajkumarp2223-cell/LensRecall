import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard, type JwtPayload } from '../../common/guards/jwt-auth.guard.js';
import { Throttle } from '@nestjs/throttler';
import {
  RegisterSchema,
  LoginSchema,
  RefreshTokenSchema,
  MagicLinkRequestSchema,
  MagicLinkVerifySchema,
  GoogleAuthSchema,
} from '@lensrecall/shared';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user and create an organization' })
  async register(@Body() body: typeof RegisterSchema._type) {
    const validated = RegisterSchema.parse(body);
    const result = await this.authService.register(validated);
    return { success: true, data: result };
  }

  @Public()
  @Throttle({ short: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() body: typeof LoginSchema._type) {
    const validated = LoginSchema.parse(body);
    const result = await this.authService.login(validated);
    return { success: true, data: result };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  async refreshToken(@Body() body: typeof RefreshTokenSchema._type) {
    const validated = RefreshTokenSchema.parse(body);
    const result = await this.authService.refreshToken(validated);
    return { success: true, data: result };
  }

  @Public()
  @Post('magic-link')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request email magic link for passwordless login' })
  async requestMagicLink(@Body() body: typeof MagicLinkRequestSchema._type) {
    const validated = MagicLinkRequestSchema.parse(body);
    const result = await this.authService.requestMagicLink(validated);
    return { success: true, data: result };
  }

  @Public()
  @Post('magic-link/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email magic link token' })
  async verifyMagicLink(@Body() body: typeof MagicLinkVerifySchema._type) {
    const validated = MagicLinkVerifySchema.parse(body);
    const result = await this.authService.verifyMagicLink(validated);
    return { success: true, data: result };
  }

  @Public()
  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate with Google profile or ID token' })
  async googleAuth(@Body() body: typeof GoogleAuthSchema._type) {
    const validated = GoogleAuthSchema.parse(body);
    const result = await this.authService.googleAuth(validated);
    return { success: true, data: result };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated token context' })
  async me(@CurrentUser() user: JwtPayload) {
    return { success: true, data: user };
  }
}
