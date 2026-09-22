import "dotenv/config";
import net from "net";
import { buildApp } from "./app";
import { validateProductionReleaseConfiguration } from "../compliance/releasePolicy";
import { startPublicRetentionScheduler } from "../compliance/retention";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  validateProductionReleaseConfiguration();

  const { server } = await buildApp();
  startPublicRetentionScheduler();

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

// A rejected promise nobody awaited must not take the process down between
// two requests, and must not be silent either.
process.on("unhandledRejection", (reason) => {
  console.error("[process] unhandled rejection:", reason instanceof Error ? reason.message.slice(0, 200) : String(reason).slice(0, 200));
});

startServer().catch((error) => {
  console.error(error);
  process.exit(1);
});
