import type { Bootstrap, NewPostInput, Report, SlotKey, SocialRole, SocialSettings } from '../shared/types';

let userId = (() => {
  try {
    return localStorage.getItem('yfs:user') ?? 'lionel-pillich';
  } catch {
    return 'lionel-pillich';
  }
})();

export function getUserId() {
  return userId;
}

export function setUserId(id: string) {
  userId = id;
  try {
    localStorage.setItem('yfs:user', id);
  } catch {
    /* ignore */
  }
}

async function request<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Fehler ${res.status}`);
  return data as T;
}

export const api = {
  bootstrap: () => request<Bootstrap>('/api/bootstrap'),
  createPost: (input: NewPostInput) => request<Bootstrap>('/api/posts', input),
  upvote: (id: string) => request<Bootstrap>(`/api/posts/${id}/upvote`, {}),
  comment: (id: string, body: string) => request<Bootstrap>(`/api/posts/${id}/comments`, { body }),
  join: (id: string, availability: SlotKey[]) => request<Bootstrap>(`/api/calls/${id}/join`, { availability }),
  leave: (id: string) => request<Bootstrap>(`/api/calls/${id}/leave`, {}),
  finalize: (id: string, slot?: SlotKey) => request<Bootstrap>(`/api/calls/${id}/finalize`, { slot }),
  unfinalize: (id: string) => request<Bootstrap>(`/api/calls/${id}/unfinalize`, {}),
  resolveOverbooking: (id: string, mode: 'expand' | 'duplicate') =>
    request<Bootstrap>(`/api/calls/${id}/resolve-overbooking`, { mode }),
  checkIn: (id: string) => request<{ meetingLink: string; state: Bootstrap }>(`/api/calls/${id}/checkin`, {}),
  readNotifications: () => request<Bootstrap>('/api/notifications/read', {}),
  report: (id: string, reason: string, commentId?: string) =>
    request<Bootstrap>(`/api/posts/${id}/report`, { reason, commentId }),
  admin: {
    updatePost: (id: string, patch: { pinned?: boolean; hidden?: boolean; commentsLocked?: boolean }) =>
      request<Bootstrap>(`/api/admin/posts/${id}`, patch),
    setCommentHidden: (postId: string, commentId: string, hidden: boolean) =>
      request<Bootstrap>(`/api/admin/posts/${postId}/comments/${commentId}`, { hidden }),
    closeCall: (id: string, reopen = false) => request<Bootstrap>(`/api/admin/calls/${id}/close`, { reopen }),
    resolveReport: (id: string, status: Exclude<Report['status'], 'open'>) =>
      request<Bootstrap>(`/api/admin/reports/${id}`, { status }),
    setRole: (memberId: string, role: SocialRole | 'member') => request<Bootstrap>('/api/admin/roles', { memberId, role }),
    setMuted: (memberId: string, muted: boolean) => request<Bootstrap>('/api/admin/mute', { memberId, muted }),
    updateSettings: (patch: Partial<SocialSettings>) => request<Bootstrap>('/api/admin/settings', patch),
  },
  demoClock: (body: { addMs?: number; reset?: boolean; jumpToCheckIn?: string }) =>
    request<Bootstrap>('/api/demo/clock', body),
  demoReset: () => request<Bootstrap>('/api/demo/reset', {}),
};
