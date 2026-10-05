/** Entrada de POST /users e PUT /users/{id}, já validada (nome já com trim). */
export type UserData = {
  nome: string;
  email: string;
  senha: string;
};

/** Entrada de PATCH /users/{id}: só o que foi enviado muda. */
export type UserPatchData = Partial<UserData>;
