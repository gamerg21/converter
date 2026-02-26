import { existsSync } from "node:fs";
import path from "node:path";
import { config as loadDotenv } from "dotenv";

const envCandidates = [
  path.resolve(process.cwd(), ".env.local"),
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../../.env.local"),
  path.resolve(process.cwd(), "../../.env")
];

for (const envPath of envCandidates) {
  if (!existsSync(envPath)) {
    continue;
  }
  loadDotenv({ path: envPath, override: false });
}
