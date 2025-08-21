import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';

dotenv.config();

export type ConfigType = {
  SENDMAIL_EMAIL: string;
  SENDMAIL_PASSWORD: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string
};

const requiredVariables = ['SENDMAIL_EMAIL', 'SENDMAIL_PASSWORD', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

const missingVariables = requiredVariables.filter((variable) => {
  const value = process.env[variable];
  return !value || value.trim() === '';
});

if (missingVariables.length > 0) {
  Logger.error(
    `Missing or empty required environment variables: ${missingVariables.join(', ')}`,
  );
  process.exit(1);
}

export const config: ConfigType = {
  SENDMAIL_EMAIL: process.env.SENDMAIL_EMAIL as string,
  SENDMAIL_PASSWORD: process.env.SENDMAIL_PASSWORD as string,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET as string,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET as string
};
