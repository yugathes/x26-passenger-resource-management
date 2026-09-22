import { startServer } from './server';

void startServer().catch((error: unknown) => {
	console.error('Failed to start server:', error);
	process.exitCode = 1;
});