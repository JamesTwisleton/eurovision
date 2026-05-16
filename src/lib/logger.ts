import fs from "fs";
import path from "path";
import { NextRequest } from "next/server";

const LOG_FILE = path.join(process.cwd(), "logs", "admin.log");

export function getIP(request: NextRequest): string {
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0].trim();
  }
  return "unknown";
}

export function logActivity(message: string, request?: NextRequest) {
  const timestamp = new Date().toISOString();
  const ip = request ? getIP(request) : "system";
  const logEntry = `[${timestamp}] [IP: ${ip}] ${message}\n`;

  try {
    const dir = path.dirname(LOG_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.appendFileSync(LOG_FILE, logEntry);
  } catch (error) {
    console.error("Failed to write to log file:", error);
  }
}

export function logError(message: string, error?: any, request?: NextRequest) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  logActivity(`ERROR: ${message}${error ? ` | ${errorMessage}` : ""}`, request);
}

export function getLogSize(): number {
  try {
    if (fs.existsSync(LOG_FILE)) {
      const stats = fs.statSync(LOG_FILE);
      return stats.size;
    }
  } catch (error) {
    console.error("Failed to get log file size:", error);
  }
  return 0;
}

export function getLogStream() {
  try {
    if (fs.existsSync(LOG_FILE)) {
      return fs.createReadStream(LOG_FILE);
    }
  } catch (error) {
    console.error("Failed to create log read stream:", error);
  }
  return null;
}
