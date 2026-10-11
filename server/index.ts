// Lokaler Node-Server: echte YFN-Profile, Daten in data/db.json.
import express, { type NextFunction, type Request, type Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { HttpError, routes } from './api';
import { yfnPack } from './content/yfn';
import { configureDb } from './db';

const PORT = Number(process.env.API_PORT ?? 3001);
const DB_FILE = path.resolve(import.meta.dirname, '../data/db.json');

configureDb(
  {
    load: () => (fs.existsSync(DB_FILE) ? fs.readFileSync(DB_FILE, 'utf8') : null),
    save: (data) => {
      fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
      fs.writeFileSync(DB_FILE, data);
    },
  },
  yfnPack,
);

const app = express();
app.use(express.json());
app.use('/media/members', express.static(path.resolve(import.meta.dirname, '../member/bilder')));

for (const r of routes) {
  const handle = (req: Request, res: Response, next: NextFunction) => {
    try {
      r.handler({ params: req.params as Record<string, string>, body: req.body, header: (n) => req.header(n) }, res);
    } catch (err) {
      next(err);
    }
  };
  if (r.method === 'GET') app.get(r.path, handle);
  else app.post(r.path, handle);
}

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Interner Fehler' });
});

app.listen(PORT, () => {
  console.log(`YF Social API läuft auf http://localhost:${PORT}`);
});
