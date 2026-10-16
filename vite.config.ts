import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { handleGroqChatRequest } from './src/server/groqServerMiddleware.ts'
import { handleTelegramRoutes, startTelegramPolling, startAutomaticAlertScheduler } from './src/server/telegramServerMiddleware.ts'

function apiServerPlugin(): Plugin {
  return {
    name: 'sevasathi-api-server',
    configureServer(server) {
      server.middlewares.use('/api/ai/groq', (req, res) => {
        handleGroqChatRequest(req, res);
      });
      server.middlewares.use('/api/telegram', (req, res) => {
        handleTelegramRoutes(req, res);
      });
      // Start real-time telegram bot listener & autonomous alert scheduler (skip in test runner)
      if (!process.env.VITEST) {
        startTelegramPolling();
        startAutomaticAlertScheduler();
      }
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/ai/groq', (req, res) => {
        handleGroqChatRequest(req, res);
      });
      server.middlewares.use('/api/telegram', (req, res) => {
        handleTelegramRoutes(req, res);
      });
      if (!process.env.VITEST) {
        startTelegramPolling();
        startAutomaticAlertScheduler();
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Populate process.env for Node.js server middleware
  Object.assign(process.env, env);

  return {
    plugins: [react(), apiServerPlugin()],
  };
});

