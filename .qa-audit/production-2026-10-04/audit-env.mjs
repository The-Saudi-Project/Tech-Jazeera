import path from 'node:path';
import { fileURLToPath } from 'node:url';
export const auditDir = path.dirname(fileURLToPath(import.meta.url));
export const root = path.resolve(auditDir, '../..');
export function isolatedEnv(mode = 'production') {
  return { ...process.env, NODE_ENV: mode, PORT: '5015', MONGODB_URI: 'mongodb://127.0.0.1:27099/crm_isolated_audit',
    JWT_ACCESS_SECRET: 'isolated-audit-only-access-not-a-production-key-20261004',
    JWT_REFRESH_SECRET: 'isolated-audit-only-refresh-not-a-production-key-20261004',
    CLIENT_URL: 'http://localhost:5175,http://127.0.0.1:5175,https://localhost', UPLOAD_DIR: path.join(auditDir, 'uploads'),
    CLOUDINARY_CLOUD_NAME: 'audit-disabled', CLOUDINARY_API_KEY: 'audit-disabled', CLOUDINARY_API_SECRET: 'audit-disabled',
    SENTRY_DSN: '', VAPID_PUBLIC_KEY: '', VAPID_PRIVATE_KEY: '', VAPID_SUBJECT: '',
    MONGOMS_SYSTEM_BINARY: 'C:/Program Files/MongoDB/Server/6.0/bin/mongod.exe', MONGOMS_VERSION: '6.0.10',
    MONGOMS_SYSTEM_BINARY_VERSION_CHECK: 'false', MONGOMS_RUNTIME_DOWNLOAD: 'false',
  };
}
