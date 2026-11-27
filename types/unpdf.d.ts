declare module "unpdf" {
  export function getDocumentProxy(data: Uint8Array | ArrayBuffer): Promise<{ numPages: number }>;
  export function extractText(
    data: Uint8Array | ArrayBuffer | { numPages: number },
    options?: { mergePages?: boolean }
  ): Promise<{ text: string; totalPages: number }>;
}
