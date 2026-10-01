import { AsyncLocalStorage } from "node:async_hooks";
import type { BlockDefinition } from "./contract";
const context = new AsyncLocalStorage<Record<string, BlockDefinition>>();
export const currentBlockDefinitions = () => context.getStore() ?? {};
export const withBlockDefinitions = <T>(
  definitions: Record<string, BlockDefinition>,
  run: () => T,
): T => context.run(definitions, run);
