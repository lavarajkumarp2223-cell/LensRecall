import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Mark a route as public — JWT authentication is skipped.
 * Use for: event landing pages, QR validation, public marketing API endpoints.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
