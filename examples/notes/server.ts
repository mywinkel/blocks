import { definePackageServer } from "@mywinkel/block-sdk/server";
import { escapeHtml } from "@mywinkel/block-sdk/public/website/content";
export default definePackageServer("@example/notes", {
  async render({ props }, host) {
    return {
      html:
        "<aside><h2>" +
        escapeHtml(
          String((props.block as { props: { heading: string } }).props.heading),
        ) +
        "</h2><p>Installed independently from GitHub.</p></aside>",
    };
  },
  async handle(request, host) {
    if (request.method === "POST")
      await host.database.sql([
        {
          sql:
            "INSERT INTO " +
            host.database.namespace +
            "notes (body) VALUES (?)",
          values: [await request.text()],
        },
      ]);
    return Response.json(
      (
        await host.database.sql([
          { sql: "SELECT body FROM " + host.database.namespace + "notes" },
        ])
      )[0].rows,
    );
  },
});
