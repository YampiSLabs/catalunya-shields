import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname } from "path";

export const readJson = <T>(path: string): T =>
  JSON.parse(readFileSync(path, "utf8"));

export const writeJson = (path: string, data: any): void => {
  if (!existsSync(dirname(path))) {
    mkdirSync(dirname(path), { recursive: true });
  }
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
};
