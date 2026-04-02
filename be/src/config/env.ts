import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

type RuntimeEnv = Partial<Record<'SUPABASE_URL' | 'SUPABASE_ANON_KEY' | 'SUPABASE_SERVICE_ROLE_KEY', string>>;

function loadPackagedEnv(): RuntimeEnv {
  const resourcesPath = process.env.ELECTRON_RESOURCES_PATH;
  if (!resourcesPath) return {};

  const configPath = path.join(resourcesPath, 'runtime-config.json');
  if (!fs.existsSync(configPath)) return {};

  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8')) as RuntimeEnv;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read runtime config: ${message}`);
  }
}

const packagedEnv = loadPackagedEnv();

function requireEnv(key: keyof RuntimeEnv): string {
  const value = process.env[key] ?? packagedEnv[key];
  if (!value) throw new Error(`Missing required env variable: ${key}`);
  return value;
}

export const env = {
  supabaseUrl: requireEnv('SUPABASE_URL'),
  supabaseAnonKey: requireEnv('SUPABASE_ANON_KEY'),
  supabaseServiceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
};
