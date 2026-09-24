import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const temporary = mkdtempSync(join(tmpdir(), "beos-contract-"));
const openApi = join(temporary, "openapi.json");
const types = join(temporary, "api-schema.d.ts");

function run(command, args, cwd = root) {
  const result = spawnSync(command, args, { cwd, stdio: "inherit" });
  if (result.status !== 0) process.exitCode = result.status ?? 1;
}

try {
  run("pnpm", ["--filter", "api", "build"]);
  if (process.exitCode) process.exit();
  run(
    "node",
    ["dist/scripts/export-openapi.js", openApi],
    join(root, "apps/api"),
  );
  if (process.exitCode) process.exit();
  run("pnpm", [
    "--filter",
    "web",
    "exec",
    "openapi-typescript",
    openApi,
    "-o",
    types,
  ]);
  if (process.exitCode) process.exit();

  const checks = [
    [openApi, join(root, "apps/api/openapi.json")],
    [types, join(root, "apps/web/src/lib/generated/api-schema.d.ts")],
  ];
  for (const [actual, expected] of checks) {
    if (!readFileSync(actual).equals(readFileSync(expected))) {
      throw new Error(`Generated contract is stale: ${expected}`);
    }
  }
  process.stdout.write("Generated API contract is current.\n");
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
