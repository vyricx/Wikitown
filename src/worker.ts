export interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
  EDITOR_KEY: string;
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

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, X-Editor-Key",
        },
      });
    }

    if (url.pathname.startsWith("/api/")) {
      return handleAPI(request, url, env);
    }

    if (url.pathname.startsWith("/media/")) {
      return handleMedia(url, env);
    }

    return new Response("Not Found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;

async function handleMedia(url: URL, env: Env): Promise<Response> {
  const key = url.pathname.replace(/^\/media\//, "");
  if (!key) return new Response("Not Found", { status: 404 });

  const object = await env.MEDIA.get(key);
  if (!object) return new Response("Not Found", { status: 404 });

  const ext = key.split(".").pop()?.toLowerCase() || "";
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  return new Response(object.body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}

async function handleAPI(request: Request, url: URL, env: Env): Promise<Response> {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  // GET /api/pages
  if (url.pathname === "/api/pages" && request.method === "GET") {
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

  // GET /api/categories - returns [{category, image}]
  if (url.pathname === "/api/categories" && request.method === "GET") {
    const result = await env.DB.prepare(`
      SELECT cats.category, ci.image
      FROM (SELECT DISTINCT category FROM pages WHERE category != '') AS cats
      LEFT JOIN category_images ci ON ci.category = cats.category
      ORDER BY cats.category ASC
    `).all();
    return new Response(JSON.stringify(result.results), { headers });
  }

  // GET or PUT /api/pages/:slug
  const pageMatch = url.pathname.match(/^\/api\/pages\/([a-z0-9-]+)$/);
  if (pageMatch) {
    const slug = pageMatch[1];

    if (request.method === "GET") {
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

    if (request.method === "PUT") {
      const editorKey = request.headers.get("X-Editor-Key");
      if (!env.EDITOR_KEY || editorKey !== env.EDITOR_KEY) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers,
        });
      }

      const body: any = await request.json();
      const { title, content, summary, category } = body;

      if (!title || content === undefined) {
        return new Response(JSON.stringify({ error: "Title and content are required" }), {
          status: 400,
          headers,
        });
      }

      await env.DB.prepare(`
        INSERT INTO pages (slug, title, content, summary, category)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(slug) DO UPDATE SET
          title = excluded.title,
          content = excluded.content,
          summary = excluded.summary,
          category = excluded.category,
          updated_at = datetime('now')
      `).bind(slug, title, content, summary || "", category || "").run();

      const updated = await env.DB.prepare(
        "SELECT * FROM pages WHERE slug = ?"
      ).bind(slug).first();

      return new Response(JSON.stringify(updated), { headers });
    }
  }

  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
    headers,
  });
}
