// Automatisch erzeugte Meeting-Räume.
// Jitsi Meet braucht weder Konto noch API-Schlüssel: Ein Raum entsteht beim
// ersten Aufruf des Links und ist für alle offen, die den Link kennen.
// Für einen eigenen Jitsi-Server (z. B. meet.yfn.de) JITSI_BASE_URL setzen.

const env = typeof process !== 'undefined' ? process.env : {};
const JITSI_BASE_URL = (env.JITSI_BASE_URL ?? 'https://meet.jit.si').replace(/\/$/, '');
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

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
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(8));
  const suffix = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
  return `${JITSI_BASE_URL}/YFN-${slug || 'Call'}-${suffix}`;
}
