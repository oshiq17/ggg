import { Global, Module } from '@nestjs/common';
import { MailService } from './mailer.service';

@Global()
@Module({
  exports: [MailService],
  providers: [MailService],
})
export class MailModule {}
