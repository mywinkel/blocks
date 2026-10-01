import type { BlockDefinition } from "./contract";
let current: Record<string, BlockDefinition> = {};
export const currentBlockDefinitions = () => current;
export function withBlockDefinitions<T>(
  definitions: Record<string, BlockDefinition>,
  run: () => T,
): T {
  current = definitions;
  return run();
}
export function installBlockDefinitions(
  definitions: Record<string, BlockDefinition>,
) {
  current = definitions;
}
