/**
 * Carrega o .env (se existir) em process.env. Importado primeiro pelo servidor
 * e pelos scripts, antes de qualquer módulo que leia variáveis de ambiente.
 * Variáveis já definidas no terminal têm prioridade sobre o arquivo.
 */
try {
  process.loadEnvFile();
} catch {
  // Sem .env: segue com o ambiente e os defaults.
}
