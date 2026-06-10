import { config } from 'dotenv';

if (process.env.DOTENV_CONFIG_PATH) {
  config({ path: process.env.DOTENV_CONFIG_PATH });
}

config({ path: '.env.local' });
config();

export function requireServerEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}
