import { app } from './app.js';
import { config } from './config.js';

// No Express 5 o callback do listen também recebe o erro (ex.: porta ocupada).
app.listen(config.port, config.host, (error?: Error) => {
  if (error) {
    const code = (error as NodeJS.ErrnoException).code;
    console.error(
      code === 'EADDRINUSE'
        ? `A porta ${config.port} já está em uso. Feche o outro servidor (Ctrl+C no terminal dele) ` +
            `ou rode com outra porta: PORT=8081 npm run dev`
        : `Não foi possível iniciar o servidor: ${error.message}`,
    );
    process.exit(1);
  }

  console.log(`Servidor ouvindo em http://${config.host}:${config.port}/api/v1`);
});
