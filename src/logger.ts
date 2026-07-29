export const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] [${new Date().toISOString()}] ${message}`, data ? JSON.stringify(data) : '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] [${new Date().toISOString()}] ${message}`, data ? JSON.stringify(data) : '');
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] [${new Date().toISOString()}] ${message}`, error instanceof Error ? error.stack : error);
  },
  network: (url: string, size: number, success: boolean, extractedCount: number) => {
    console.log(
      `[NETWORK] [${new Date().toISOString()}] URL: ${url} | Size: ${size} bytes | Parsed: ${success} | Matches Extracted: ${extractedCount}`
    );
  }
};
