// Browser-Variante der API für die statische Demo (GitHub Pages): dieselben
// Routen wie auf dem Server, Daten pro Browser im localStorage.
import { HttpError, routes } from '../server/api';
import { demoPack } from '../server/content/demo';
import { configureDb } from '../server/db';

const KEY = 'yfs:demo-db';

configureDb(
  {
    load: () => {
      try {
        return localStorage.getItem(KEY);
      } catch {
        return null;
      }
    },
    save: (data) => {
      try {
        localStorage.setItem(KEY, data);
      } catch {
        /* z. B. privater Modus – Daten bleiben dann nur bis zum Neuladen */
      }
    },
  },
  demoPack,
);

const compiled = routes.map((r) => {
  const names: string[] = [];
  const pattern = new RegExp(
    `^${r.path.replace(/:([a-zA-Z]+)/g, (_, n) => {
      names.push(n);
      return '([^/]+)';
    })}$`,
  );
  return { ...r, pattern, names };
});

export async function localRequest<T>(path: string, method: 'GET' | 'POST', body: unknown, userId: string | null): Promise<T> {
  for (const r of compiled) {
    if (r.method !== method) continue;
    const m = path.match(r.pattern);
    if (!m) continue;
    const params = Object.fromEntries(r.names.map((n, i) => [n, decodeURIComponent(m[i + 1])]));
    let result: unknown;
    try {
      r.handler(
        {
          params,
          body: body === undefined ? {} : JSON.parse(JSON.stringify(body)),
          header: (n) => (n.toLowerCase() === 'x-user-id' ? (userId ?? undefined) : undefined),
        },
        { json: (data) => (result = data) },
      );
    } catch (err) {
      throw new Error(err instanceof HttpError ? err.message : 'Interner Fehler');
    }
    // Kopie zurückgeben, damit React keine Objekte des Speichers verändert.
    return JSON.parse(JSON.stringify(result)) as T;
  }
  throw new Error(`Unbekannte Route: ${method} ${path}`);
}
