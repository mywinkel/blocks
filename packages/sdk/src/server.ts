import type { PackageContext, PackageServer } from "./manifest";
type Environment = {
  HOST: { sql: PackageContext["database"]["sql"] };
  namespace: string;
  tenantId: string;
  actor?: PackageContext["actor"];
};
/** This adapter runs inside the package Worker. HOST is a capability supplied by
 * the CMS; it cannot select a tenant, package identity or schema grant. */
export function definePackageServer(name: string, server: PackageServer) {
  return {
    async fetch(request: Request, env: Environment) {
      const url = new URL(request.url);
      if (url.pathname === "/validate") return Response.json({ ready: true });
      const context: PackageContext = {
        packageName: name,
        tenantId: env.tenantId,
        database: {
          namespace: env.namespace,
          sql: (queries) => env.HOST.sql(queries),
        },
        actor: env.actor ?? null,
      };
      if (url.pathname === "/render") {
        const input = (await request.json()) as Parameters<
          NonNullable<PackageServer["render"]>
        >[0];
        if (!server.render) return Response.json({ html: "", head: "" });
        return Response.json(await server.render(input, context));
      }
      return server.handle
        ? server.handle(request, context)
        : new Response("Not found", { status: 404 });
    },
  };
}
