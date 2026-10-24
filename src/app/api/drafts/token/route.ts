import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { fail } from "@/lib/http";
export const runtime = "nodejs";
/** Issues a short-lived token so the browser uploads the video straight to Blob (function bodies cap at 4.5 MB). */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as HandleUploadBody;
    const json = await handleUpload({
      body, request: req,
      onBeforeGenerateToken: async (pathname) => {
        if (!/^drafts\/[0-9a-f-]{36}\/video$/.test(pathname)) throw new Error("Bad path");
        return { allowedContentTypes: ["video/*"], maximumSizeInBytes: 60_000_000, addRandomSuffix: false };
      },
      onUploadCompleted: async () => {},
    });
    return Response.json(json);
  } catch (e) { return fail(e); }
}
