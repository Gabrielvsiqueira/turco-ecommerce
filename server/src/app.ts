import express from 'express';
import { errorHandler } from './http/middlewares/error-handler.js';
import { routeNotFound } from './http/middlewares/fallbacks.js';
import { protocolCors } from './http/middlewares/protocol-cors.js';
import { routes } from './routes.js';

export const app = express();

app.disable('x-powered-by');
// Sem ETag: evita respostas 304, que o protocolo não prevê.
app.set('etag', false);

// Regra 5: primeiro de todos, para os cabeçalhos CORS irem em toda resposta.
app.use(protocolCors);

// Só guarda o corpo cru, sem interpretar: quem lê o JSON é parseBody, no
// controller, para respeitar a ordem da regra 10 e aceitar qualquer Content-Type.
app.use(express.raw({ type: () => true, limit: '1mb' }));

// Regra 1: toda rota começa com /api/v1.
app.use('/api/v1', routes);

app.use(routeNotFound);
app.use(errorHandler);
