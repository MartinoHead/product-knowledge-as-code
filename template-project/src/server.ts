import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();

const persistenceMode = env.databaseUrl?.trim() ? 'persistent-db' : 'not-configured';

app.listen(env.port, () => {
  console.log(`API server listening on port ${env.port} (${env.nodeEnv})`);
  console.log(`Identity persistence mode: ${persistenceMode}`);
});
