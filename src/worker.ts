export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return new Response("Hello from Wikitown!", {
      headers: { "content-type": "text/plain" },
    });
  },
} satisfies ExportedHandler<Env>;
