export interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
}

const MIME_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  mp3: "audio/mpeg",
  ogg: "audio/ogg",
  wav: "audio/wav",
  flac: "audio/flac",
  mp4: "video/mp4",
  webm: "video/webm",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      return handleAPI(url, env);
    }

    // Serve media files from R2
    if (url.pathname.startsWith("/media/")) {
      return handleMedia(url, env);
    }

    return new Response("Not Found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;

async function handleMedia(url: URL, env: Env): Promise<Response> {
  const key = url.pathname.replace(/^\/media\//, "");
  if (!key) {
    return new Response("Not Found", { status: 404 });
  }

  const object = await env.MEDIA.get(key);
  if (!object) {
    return new Response("Not Found", { status: 404 });
  }

  const ext = key.split(".").pop()?.toLowerCase() || "";
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  return new Response(object.body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}

async function handleAPI(url: URL, env: Env): Promise<Response> {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  // GET /api/pages - list all pages
  if (url.pathname === "/api/pages") {
    const query = url.searchParams.get("q");
    const category = url.searchParams.get("category");

    let sql = "SELECT id, slug, title, summary, category, updated_at FROM pages";
    const params: string[] = [];
    const conditions: string[] = [];

    if (query) {
      conditions.push("(title LIKE ? OR content LIKE ?)");
      params.push(`%${query}%`, `%${query}%`);
    }
    if (category) {
      conditions.push("category = ?");
      params.push(category);
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }
    sql += " ORDER BY title ASC";

    const result = await env.DB.prepare(sql).bind(...params).all();
    return new Response(JSON.stringify(result.results), { headers });
  }

  // GET /api/pages/:slug - get a single page
  const pageMatch = url.pathname.match(/^\/api\/pages\/([a-z0-9-]+)$/);
  if (pageMatch) {
    const slug = pageMatch[1];
    const page = await env.DB.prepare(
      "SELECT * FROM pages WHERE slug = ?"
    ).bind(slug).first();

    if (!page) {
      return new Response(JSON.stringify({ error: "Page not found" }), {
        status: 404,
        headers,
      });
    }
    return new Response(JSON.stringify(page), { headers });
  }

  // GET /api/categories - list all categories
  if (url.pathname === "/api/categories") {
    const result = await env.DB.prepare(
      "SELECT DISTINCT category FROM pages WHERE category != '' ORDER BY category ASC"
    ).all();
    return new Response(JSON.stringify(result.results.map((r: any) => r.category)), { headers });
  }

  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
    headers,
  });
}
