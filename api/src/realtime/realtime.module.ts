import { Module } from '@nestjs/common';
import { PresenceService } from './presence.service.js';
import { RealtimeGateway } from './realtime.gateway.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  providers: [RealtimeGateway, PresenceService],
  exports: [PresenceService],
})
export class RealtimeModule {}
