import { createHash } from "node:crypto";

export async function downloadZip(url: string): Promise<{ zip: Uint8Array; sha256: string }> {
  const response = await fetch(url);
  const zip = new Uint8Array(await response.arrayBuffer());
  return { zip, sha256: createHash("sha256").update(zip).digest("hex") };
}
