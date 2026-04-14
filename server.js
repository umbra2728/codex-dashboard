import { createDashboardServer } from './server/app.js';

const runtime = await createDashboardServer();
await runtime.start();

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  console.info(`Received ${signal}. Shutting down dashboard.`);

  try {
    await runtime.close();
    process.exit(0);
  } catch (error) {
    console.error('Failed to shut down cleanly.', error);
    process.exit(1);
  }
}

function registerShutdownHandler(signal) {
  process.on(signal, function handleSignal() {
    void shutdown(signal);
  });
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  registerShutdownHandler(signal);
}
