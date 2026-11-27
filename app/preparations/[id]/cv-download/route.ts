import { readCvRevision, readCvSource, renderCvRevision } from "../../../../lib/cv-revision";
import { requireAccount } from "../../../../lib/session";

function getContentType(format: string): string {
  switch (format) {
    case "pdf":
      return "application/pdf";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    default:
      return "text/plain; charset=utf-8";
  }
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[/\\?%*:|"<>]/g, "_").replace(/"/g, "");
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const account = await requireAccount();
  const { id } = await params;
  const query = new URL(request.url).searchParams;
  const number = query.get("version");
  const version = Number(number);
  if (!Number.isSafeInteger(version) || version < 1) return new Response(null, { status: 404 });
  const original = await readCvSource(account, id, version);
  if (!original) return new Response(null, { status: 404 });

  let content: BodyInit = new Uint8Array(original.source);
  let contentType = getContentType(original.format);
  const safeBaseName = original.filename ? sanitizeFilename(original.filename) : `cv-v${version}`;
  let downloadName = `original-${safeBaseName}`;

  const revised = query.get("mode") === "revised";
  if (revised) {
    const revision = await readCvRevision(account, id);
    if (!revision || revision.cv.version !== version) return new Response(null, { status: 404 });
    const lines = new Set(query.getAll("line"));
    const selected = revision.edits.filter(({ line }) => lines.has(String(line)));
    if (selected.length !== lines.size) return new Response("Invalid selection. Reopen CV review.", { status: 400 });
    // Revised highlights are rendered as plain text
    if (selected.length) {
      content = renderCvRevision(new TextDecoder().decode(original.source), selected);
      contentType = "text/plain; charset=utf-8";
      downloadName = "revised-cv.txt";
    }
  }

  return new Response(content, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${downloadName}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
