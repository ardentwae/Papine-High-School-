import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Security & Role Definition
const VALID_ROLES = [
  'System Administrator',
  'Printing Administrator',
  'Printing Staff',
  'Teacher',
  'Finance Officer',
  'Read-only Management',
] as const;

type Role = typeof VALID_ROLES[number];

const ROLE_PERMISSIONS: Record<Role, string[]> = {
  'System Administrator': ['*'],
  'Printing Administrator': [
    'documents:*',
    'queue:*',
    'teachers:*',
    'students:*',
    'payments:*',
    'printers:*',
    'inventory:*',
    'maintenance:*',
    'reports:*',
    'audit:read',
    'settings:read',
  ],
  'Printing Staff': [
    'documents:read',
    'documents:create',
    'queue:*',
    'students:*',
    'printers:read',
    'printers:status',
    'inventory:issue',
    'maintenance:create',
    'reports:read',
  ],
  Teacher: [
    'documents:read',
    'documents:create',
    'queue:read',
    'teachers:read_self',
  ],
  'Finance Officer': [
    'students:*',
    'payments:*',
    'reports:*',
    'audit:read',
  ],
  'Read-only Management': [
    'documents:read',
    'queue:read',
    'teachers:read',
    'students:read',
    'payments:read',
    'printers:read',
    'inventory:read',
    'maintenance:read',
    'reports:*',
    'audit:read',
  ],
};

// 1. Health Endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'HEALTHY',
    school: 'Papine High School',
    service: 'Printing & Document Management System',
    timestamp: new Date().toISOString(),
    timezone: 'America/Jamaica',
    currency: 'JMD',
    version: '2.4.0',
  });
});

// 2. Server-side Role Authorization Verification
app.post('/api/auth/verify-role', (req: Request, res: Response) => {
  const { role, permission } = req.body;
  if (!role || !VALID_ROLES.includes(role)) {
    return res.status(400).json({ valid: false, error: 'Invalid user role' });
  }

  const permissions = ROLE_PERMISSIONS[role as Role] || [];
  const hasAccess =
    permissions.includes('*') ||
    permissions.includes(permission) ||
    permissions.some((p) => p.endsWith(':*') && permission.startsWith(p.split(':')[0]));

  return res.json({
    valid: true,
    role,
    permission,
    granted: hasAccess,
  });
});

// 3. Server-side PDF Upload Validation (Strict 25MB + PDF MIME)
app.post('/api/documents/validate-pdf', (req: Request, res: Response) => {
  const { fileName, sizeBytes, mimeType } = req.body;

  if (!fileName || typeof sizeBytes !== 'number') {
    return res.status(400).json({
      valid: false,
      error: 'Missing file metadata for validation',
    });
  }

  const MAX_SIZE = 25 * 1024 * 1024; // 25 MB
  if (sizeBytes > MAX_SIZE) {
    return res.status(400).json({
      valid: false,
      error: `File size exceeds strict 25 MB limit. Received: ${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`,
    });
  }

  const isPdf =
    mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
  if (!isPdf) {
    return res.status(400).json({
      valid: false,
      error: 'Invalid file format. Only PDF documents are authorized for print registration.',
    });
  }

  return res.json({
    valid: true,
    fileName,
    sizeBytes,
    message: 'PDF passed institutional validation checks.',
  });
});

// 4. Server-side Audit Logger
const serverAuditLogStore: Array<{
  id: string;
  timestamp: string;
  module: string;
  action: string;
  user: string;
  details: string;
}> = [];

app.post('/api/audit/log', (req: Request, res: Response) => {
  const { module, action, user, details, recordId } = req.body;
  const entry = {
    id: `SRV-AUD-${Date.now()}`,
    timestamp: new Date().toISOString(),
    module: module || 'General',
    action: action || 'Action',
    user: user || 'Anonymous',
    details: details || '',
    recordId: recordId || '',
  };
  serverAuditLogStore.unshift(entry);
  if (serverAuditLogStore.length > 500) serverAuditLogStore.pop();

  return res.json({ success: true, logId: entry.id });
});

app.get('/api/audit/logs', (req: Request, res: Response) => {
  return res.json({
    count: serverAuditLogStore.length,
    logs: serverAuditLogStore.slice(0, 50),
  });
});

// Vite Middleware mounting for Dev or Static files in Prod
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Papine High School Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
