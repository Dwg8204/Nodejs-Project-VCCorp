/**
 * =============================================================
 * App Controller - Health check & các route chung
 * =============================================================
 */

import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  /**
   * Health check endpoint
   * GET /api/health
   */
  @Get('health')
  healthCheck() {
    return {
      status: 'OK',
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    };
  }
}
