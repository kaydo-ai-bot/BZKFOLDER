import express from 'express';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(cookieParser('kaydo_secret_cookie_key_2026'));

// File path for persistent admin secret storage
const SECRET_FILE = path.resolve(__dirname, 'admin_secret.json');

interface SecretData {
  secret: string;
  updatedAt: string;
  changedOnce?: boolean;
}

function getStoredAdminSecretData(): SecretData {
  try {
    if (fs.existsSync(SECRET_FILE)) {
      const data = JSON.parse(fs.readFileSync(SECRET_FILE, 'utf-8'));
      if (data && data.secret && typeof data.secret === 'string' && data.secret.trim().length > 0) {
        return {
          secret: data.secret.trim(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          changedOnce: !!data.changedOnce,
        };
      }
    }
  } catch (e) {
    console.warn('Could not read admin_secret.json, falling back to env/default');
  }
  return {
    secret: (process.env.ADMIN_ACCESS || 'kaydo_admin_2026').trim(),
    updatedAt: new Date().toISOString(),
    changedOnce: false,
  };
}

function getStoredAdminSecret(): string {
  return getStoredAdminSecretData().secret;
}

function saveAdminSecretOnce(newSecret: string): boolean {
  const current = getStoredAdminSecretData();
  if (current.changedOnce) {
    return false; // Already changed once! Cannot change again.
  }
  try {
    fs.writeFileSync(
      SECRET_FILE,
      JSON.stringify({
        secret: newSecret.trim(),
        updatedAt: new Date().toISOString(),
        changedOnce: true,
      }, null, 2),
      'utf-8'
    );
    return true;
  } catch (e) {
    console.error('Could not save admin_secret.json', e);
    return false;
  }
}

// Session Store (In-Memory Token Map)
const validAdminSessions = new Map<string, { createdAt: number; expiresAt: number }>();

function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Admin Authentication Middleware
function requireAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.cookies?.kaydo_admin_session;
  if (!token) {
    return res.status(401).json({ error: 'Accès refusé. Session administrateur manquante.' });
  }

  const session = validAdminSessions.get(token);
  if (!session || Date.now() > session.expiresAt) {
    validAdminSessions.delete(token);
    res.clearCookie('kaydo_admin_session');
    return res.status(401).json({ error: 'Session expirée. Veuillez vous reconnecter.' });
  }

  next();
}

// --- API ROUTES ---

// Admin Google Login (Only kberryprime@gmail.com allowed)
app.post('/api/admin/google-login', (req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string' || email.trim().toLowerCase() !== 'kberryprime@gmail.com') {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Seul le compte Google kberryprime@gmail.com est autorisé à accéder à l\'espace propriétaire.',
    });
  }

  const token = generateSessionToken();
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

  validAdminSessions.set(token, { createdAt: Date.now(), expiresAt });

  res.cookie('kaydo_admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  });

  return res.json({
    success: true,
    message: 'Authentification Google propriétaire réussie.',
  });
});

// Admin Login
app.post('/api/admin/login', (req, res) => {
  const { accessKey } = req.body;

  if (!accessKey || typeof accessKey !== 'string') {
    return res.status(400).json({ success: false, message: 'Veuillez saisir votre code d\'accès.' });
  }

  const currentSecret = getStoredAdminSecret();
  const inputKey = accessKey.trim();

  if (inputKey !== currentSecret && inputKey !== (process.env.ADMIN_ACCESS || '').trim()) {
    return res.status(401).json({
      success: false,
      message: 'Code propriétaire incorrect.',
    });
  }

  const token = generateSessionToken();
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

  validAdminSessions.set(token, { createdAt: Date.now(), expiresAt });

  res.cookie('kaydo_admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  });

  return res.json({
    success: true,
    message: 'Authentification propriétaire réussie.',
  });
});

// Set Admin Secret Code (Can be done ONLY ONCE and saved forever)
app.post('/api/admin/set-code', (req, res) => {
  const currentData = getStoredAdminSecretData();
  if (currentData.changedOnce) {
    return res.status(400).json({
      success: false,
      message: 'Le code propriétaire a déjà été défini et enregistré à jamais. Il ne peut plus être modifié.',
    });
  }

  const { newCode } = req.body;

  if (!newCode || typeof newCode !== 'string' || newCode.trim().length < 3) {
    return res.status(400).json({
      success: false,
      message: 'Le nouveau code doit comporter au moins 3 caractères.',
    });
  }

  const cleanCode = newCode.trim();
  const saved = saveAdminSecretOnce(cleanCode);
  if (!saved) {
    return res.status(400).json({
      success: false,
      message: 'Le code propriétaire a déjà été défini et enregistré à jamais. Il ne peut plus être modifié.',
    });
  }

  // Automatically authenticate owner upon successfully setting code
  const token = generateSessionToken();
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
  validAdminSessions.set(token, { createdAt: Date.now(), expiresAt });

  res.cookie('kaydo_admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  });

  return res.json({
    success: true,
    message: 'Code propriétaire défini avec succès et enregistré à jamais ! Vous êtes connecté.',
  });
});

// Admin Status (Checks session & whether code has been set once)
app.get('/api/admin/status', (req, res) => {
  const token = req.cookies?.kaydo_admin_session;
  let authenticated = false;
  if (token) {
    const session = validAdminSessions.get(token);
    if (session && Date.now() <= session.expiresAt) {
      authenticated = true;
    } else {
      validAdminSessions.delete(token);
      res.clearCookie('kaydo_admin_session');
    }
  }

  const data = getStoredAdminSecretData();
  return res.json({
    authenticated,
    codeSetOnce: !!data.changedOnce,
  });
});

// Admin Session Check
app.get('/api/admin/session', (req, res) => {
  const token = req.cookies?.kaydo_admin_session;
  if (!token) {
    return res.json({ authenticated: false });
  }

  const session = validAdminSessions.get(token);
  if (!session || Date.now() > session.expiresAt) {
    validAdminSessions.delete(token);
    res.clearCookie('kaydo_admin_session');
    return res.json({ authenticated: false });
  }

  return res.json({ authenticated: true });
});

// Admin Logout
app.post('/api/admin/logout', (req, res) => {
  const token = req.cookies?.kaydo_admin_session;
  if (token) {
    validAdminSessions.delete(token);
  }
  res.clearCookie('kaydo_admin_session');
  return res.json({ success: true, message: 'Déconnexion réussie.' });
});

// Gemini AI Analytics Endpoint for Admin
app.post('/api/admin/ai-analytics', requireAdminAuth, async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY non configurée sur le serveur.' });
    }

    const { stats } = req.body;

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
Tu es un analyste de données senior pour BZK FOLDER 🥷 BY KAYDO BZK 🥷.
Génère une analyse synthétique et professionnelle en français basée uniquement sur ces métriques BZK anonymisées:
- Total BZK: ${stats.totalContacts || 0}
- BZK Hommes: ${stats.maleContacts || 0}
- BZK Femmes: ${stats.femaleContacts || 0}
- Nouveaux BZK aujourd'hui: ${stats.newToday || 0}
- Nouveaux BZK cette semaine: ${stats.newThisWeek || 0}
- BZK Actifs: ${stats.activeAccounts || 0}
- Partages BZK: ${stats.sharedStatuses || 0}
- Répartition par pays: ${JSON.stringify(stats.countryBreakdown || {})}

Donne 3 points clés, une évaluation de l'engagement BZK et 2 recommandations stratégiques pour le propriétaire de BZK FOLDER 🥷 BY KAYDO BZK 🥷.
Garde un ton moderne, direct, sans divulguer de données personnelles.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return res.json({ analysis: response.text });
  } catch (error) {
    console.error('Erreur Gemini AI Analytics:', error);
    return res.status(500).json({ error: 'Échec du traitement par l\'IA.' });
  }
});

// --- VITE & STATIC FILES INTEGRATION ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Fallback for SPA routing in development
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 KAYDO FOLDER BZK Backend running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
