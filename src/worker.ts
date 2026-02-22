export interface Env {
  DB: D1Database;
}

const EDITOR_KEY = "EditorKeyWikitown2026xQ9mR4bL7pZwNcYsV3jKd8fHgTaU";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // API routes
    if (url.pathname.startsWith("/api/")) {
      return handleAPI(request, url, env);
    }

    return new Response("Not Found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;

async function handleAPI(request: Request, url: URL, env: Env): Promise<Response> {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

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

  // GET /api/pages - list all pages
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

  // GET /api/categories - list all categories
  if (url.pathname === "/api/categories" && request.method === "GET") {
    const result = await env.DB.prepare(
      "SELECT DISTINCT category FROM pages WHERE category != '' ORDER BY category ASC"
    ).all();
    return new Response(JSON.stringify(result.results.map((r: any) => r.category)), { headers });
  }

  // GET or PUT /api/pages/:slug
  const pageMatch = url.pathname.match(/^\/api\/pages\/([a-z0-9-]+)$/);
  if (pageMatch) {
    const slug = pageMatch[1];

    // GET single page
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

    // PUT update page (requires editor key)
    if (request.method === "PUT") {
      const editorKey = request.headers.get("X-Editor-Key");
      if (editorKey !== EDITOR_KEY) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers,
        });
      }

      const body: any = await request.json();
      const { title, content, summary, category } = body;

      await env.DB.prepare(
        "UPDATE pages SET title = ?, content = ?, summary = ?, category = ?, updated_at = datetime('now') WHERE slug = ?"
      ).bind(title, content, summary, category, slug).run();

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
