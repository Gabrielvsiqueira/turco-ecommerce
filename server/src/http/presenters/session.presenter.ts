import type { CreatedSession } from '../../data/session-data.js';
import { presentUser, type UserResponse } from './user.presenter.js';

/** Schema SessionResponse do YAML. */
export type SessionResponse = {
  id: string;
  token: string;
  usuario: UserResponse;
};

export function presentSession(session: CreatedSession): SessionResponse {
  return { id: session.id, token: session.token, usuario: presentUser(session.user) };
}
