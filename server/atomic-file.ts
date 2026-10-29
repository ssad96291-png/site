import { renameSync } from "node:fs";

const transientWindowsErrors = new Set(["EACCES", "EBUSY", "EPERM"]);
const retryDelaysMs = [10, 20, 40, 60, 80, 90] as const;
const waitCell = new Int32Array(new SharedArrayBuffer(4));

type ReplaceOptions = {
  platform?: NodeJS.Platform;
  rename?: (source: string, destination: string) => void;
  wait?: (milliseconds: number) => void;
};

/** Replace a fully written/fsynced sibling file without ever deleting the old
 * destination. Windows antivirus/indexing can briefly hold a handle without
 * FILE_SHARE_DELETE; a bounded retry tolerates those sharing violations.
 * Permanent errors still surface with their original code and cause.
 */
export function replaceAtomicFileSync(
  source: string,
  destination: string,
  options: ReplaceOptions = {},
): void {
  const platform = options.platform ?? process.platform;
  const rename = options.rename ?? renameSync;
  const wait =
    options.wait ??
    ((milliseconds: number) => {
      Atomics.wait(waitCell, 0, 0, milliseconds);
    });

  for (let attempt = 0; ; attempt++) {
    try {
      rename(source, destination);
      return;
    } catch (error) {
      if (
        platform !== "win32" ||
        !transientWindowsErrors.has(
          (error as NodeJS.ErrnoException)?.code || "",
        ) ||
        attempt >= retryDelaysMs.length
      )
        throw error;
      wait(retryDelaysMs[attempt]);
    }
  }
}
