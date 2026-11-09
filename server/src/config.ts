/**
 * Configuração lida do ambiente.
 * Regra 1: IP e porta ficam a critério de quem sobe o servidor; 8080 é o default do YAML.
 */
export const config = {
  host: process.env.HOST ?? '0.0.0.0',
  port: Number(process.env.PORT ?? 8080),
  /**
   * Painel de usuários logados no console. PAINEL=off volta para o log em
   * linhas (útil para depurar: o painel limpa a tela a cada evento).
   */
  panel: process.env.PAINEL !== 'off',
};
