import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { setCheckinLead } from '../shared/schedule';
import type { Bootstrap, Member, Post, SocialRole } from '../shared/types';
import { api, getUserId, setUserId } from './api';

interface Store {
  state: Bootstrap;
  me: Member;
  /** Rolle des aktuellen Nutzers in YF Social. */
  myRole: SocialRole | undefined;
  isStaff: boolean;
  view: View;
  setView: (v: View) => void;
  now: Date;
  member: (id: string) => Member | undefined;
  post: (id: string) => Post | undefined;
  /** Führt eine API-Aktion aus, übernimmt den neuen Zustand, zeigt Fehler als Toast. */
  run: (fn: () => Promise<Bootstrap>, success?: string) => Promise<boolean>;
  apply: (state: Bootstrap) => void;
  switchUser: (id: string) => Promise<void>;
  toast: (text: string, tone?: 'ok' | 'error') => void;
  toasts: { id: number; text: string; tone: 'ok' | 'error' }[];
  openProfile: (id: string | null) => void;
  profileId: string | null;
  openCall: (id: string | null) => void;
  callId: string | null;
}

export type View = 'social' | 'admin';

const Ctx = createContext<Store | null>(null);

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('StoreProvider fehlt');
  return s;
}

let toastSeq = 0;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Bootstrap | null>(null);
  const [offset, setOffset] = useState(0); // Serverzeit − lokale Zeit
  const [tick, setTick] = useState(Date.now());
  const [toasts, setToasts] = useState<Store['toasts']>([]);
  const [profileId, openProfile] = useState<string | null>(null);
  const [callId, openCall] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [view, setView] = useState<View>('social');

  const apply = useCallback((s: Bootstrap) => {
    setOffset(new Date(s.serverNow).getTime() - Date.now());
    setCheckinLead(s.settings.checkinLeadMin);
    setState(s);
  }, []);

  const toast = useCallback((text: string, tone: 'ok' | 'error' = 'ok') => {
    const id = ++toastSeq;
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  const run = useCallback(
    async (fn: () => Promise<Bootstrap>, success?: string) => {
      try {
        apply(await fn());
        if (success) toast(success);
        return true;
      } catch (e) {
        toast((e as Error).message, 'error');
        return false;
      }
    },
    [apply, toast],
  );

  useEffect(() => {
    api.bootstrap().then(apply, (e: Error) => {
      // Gespeicherter Demo-Nutzer existiert evtl. nicht mehr.
      setUserId('lionel-pillich');
      api.bootstrap().then(apply, () => setLoadError(e.message));
    });
    const t = setInterval(() => setTick(Date.now()), 15_000);
    return () => clearInterval(t);
  }, [apply]);

  const switchUser = useCallback(
    async (id: string) => {
      setUserId(id);
      await run(() => api.bootstrap());
    },
    [run],
  );

  const value = useMemo<Store | null>(() => {
    if (!state) return null;
    const members = new Map(state.members.map((m) => [m.id, m]));
    const posts = new Map(state.posts.map((p) => [p.id, p]));
    const myRole = state.roles[getUserId()];
    return {
      state,
      me: members.get(getUserId())!,
      myRole,
      isStaff: myRole !== undefined,
      // Ohne Rolle gibt es keinen Admin-Bereich.
      view: myRole ? view : 'social',
      setView,
      now: new Date(tick + offset),
      member: (id) => members.get(id),
      post: (id) => posts.get(id),
      run,
      apply,
      switchUser,
      toast,
      toasts,
      openProfile,
      profileId,
      openCall,
      callId,
    };
  }, [state, tick, offset, run, apply, switchUser, toast, toasts, profileId, callId, view]);

  if (loadError) {
    return (
      <div className="boot">
        API nicht erreichbar: {loadError}. Läuft <code>npm run dev</code>?
      </div>
    );
  }
  if (!value) return <div className="boot">YF Social lädt …</div>;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
