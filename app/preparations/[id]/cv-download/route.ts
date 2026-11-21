import { readCvRevision, readCvSource, renderCvRevision } from "../../../../lib/cv-revision";
import { requireAccount } from "../../../../lib/session";

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
  const revised = query.get("mode") === "revised";
  if (revised) {
    const revision = await readCvRevision(account, id);
    if (!revision || revision.cv.version !== version) return new Response(null, { status: 404 });
    const lines = new Set(query.getAll("line"));
    const selected = revision.edits.filter(({ line }) => lines.has(String(line)));
    if (selected.length !== lines.size) return new Response("Invalid selection. Reopen CV review.", { status: 400 });
    if (selected.length) content = renderCvRevision(new TextDecoder().decode(original.source), selected);
  }
  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${revised ? "revised-cv.txt" : "original-cv.txt"}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
