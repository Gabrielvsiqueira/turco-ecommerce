import type { components } from './schema';

/*
 * Atalhos para os schemas do YAML. Os tipos vêm de schema.ts, que é gerado
 * a partir do protocolo (npm run gen:api): nunca editar schema.ts à mão.
 */
type Schemas = components['schemas'];

export type LoginRequest = Schemas['LoginRequest'];
export type UserRequest = Schemas['UserRequest'];
export type UserPatchRequest = Schemas['UserPatchRequest'];
export type UserResponse = Schemas['UserResponse'];
export type SessionResponse = Schemas['SessionResponse'];
