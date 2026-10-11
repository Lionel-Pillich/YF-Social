// Automatisch erzeugte Meeting-Räume.
// Jitsi Meet braucht weder Konto noch API-Schlüssel: Ein Raum entsteht beim
// ersten Aufruf des Links und ist für alle offen, die den Link kennen.
// Für einen eigenen Jitsi-Server (z. B. meet.yfn.de) JITSI_BASE_URL setzen.
import { randomBytes } from 'node:crypto';

const JITSI_BASE_URL = (process.env.JITSI_BASE_URL ?? 'https://meet.jit.si').replace(/\/$/, '');

/** Lesbarer Raumname aus dem Thema plus zufälliger, nicht erratbarer Suffix. */
export function generateMeetingLink(title: string): string {
  const slug = title
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/Ä/g, 'Ae')
    .replace(/Ö/g, 'Oe')
    .replace(/Ü/g, 'Ue')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  const suffix = randomBytes(6).toString('base64url').replace(/[-_]/g, 'x');
  return `${JITSI_BASE_URL}/YFN-${slug || 'Call'}-${suffix}`;
}
