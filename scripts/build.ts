import { build, transform } from "esbuild";
import { compile, compileModule } from "svelte/compiler";
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { z } from "zod";
const root = resolve(import.meta.dirname, "..");
const checkout = new Set([
  "booking",
  "cart",
  "classes",
  "membership",
  "preorder",
  "rental",
]);
const account = new Set([
  "customer-account",
  "request-status",
  "quote-acceptance",
]);
export async function buildPackages() {
  for (const name of await readdir(resolve(root, "packages"))) {
    if (name === "sdk") continue;
    const directory = resolve(root, "packages", name),
      dist = resolve(directory, "dist");
    await mkdir(dist, { recursive: true });
    const { definition } = await import(resolve(directory, "definition.ts"));
    const schema = z.toJSONSchema(definition.schema, {
      unrepresentable: "any",
    });
    const mode = checkout.has(name)
      ? "checkout"
      : account.has(name)
        ? name
        : name === "menu"
          ? "menu"
          : name === "enquiry"
            ? "enquiry"
            : name === "form"
              ? "form"
              : "block";
    const manifest = {
      format: 1,
      name: "@mywinkel/block-" + name,
      version: "0.1.0",
      sdkVersion: "0.1",
      blocks: [
        {
          id: name,
          label: definition.label,
          description: definition.description,
          configuration: schema,
          fields: definition.fields,
          parts: definition.parts,
          interactive: definition.interactive,
          children: !!definition.children,
          viewMode: mode,
        },
      ],
      entries: {
        server: "dist/server.js",
        browser: "dist/browser.js",
        settings: "dist/settings.js",
      },
      migrations: [],
    };
    await writeFile(
      resolve(directory, "block-package.json"),
      JSON.stringify(manifest, null, 2) + "\n",
    );
    for (const kind of ["server", "browser", "settings"] as const) {
      const sveltePlugin = {
        name: "svelte-package",
        setup(builder: import("esbuild").PluginBuild) {
          builder.onLoad({ filter: /\.svelte$/ }, async ({ path }) => ({
            contents: compile(await readFile(path, "utf8"), {
              filename: path,
              generate: kind === "server" ? "server" : "client",
            }).js.code,
            loader: "js",
            resolveDir: dirname(path),
          }));
          builder.onLoad({ filter: /\.svelte\.ts$/ }, async ({ path }) => ({
            contents: compileModule(
              (await transform(await readFile(path, "utf8"), { loader: "ts" }))
                .code,
              {
                filename: path,
                generate: kind === "server" ? "server" : "client",
              },
            ).js.code,
            loader: "js",
            resolveDir: dirname(path),
          }));
        },
      };
      const entry =
        kind === "server"
          ? `import {render} from 'svelte/server';import {createRawSnippet} from 'svelte';import View from './View.svelte';export default {async fetch(request,env){const input=await request.json();if(input.operation==='validate')return Response.json({ready:true});const props={...input.props};if(input.children)props.children=createRawSnippet(()=>({render:()=>input.children}));const result=render(View,{props});return Response.json({html:result.body,head:result.head});}};`
          : kind === "browser"
            ? `import {hydrate} from 'svelte';import View from './View.svelte';export function mount(target,props){return hydrate(View,{target,props});}`
            : `import {mount} from 'svelte';import Settings from './Settings.svelte';import MediaPicker from '@mywinkel/block-sdk/editor/RemoteMediaPicker.svelte';let port;window.addEventListener('message',event=>{if(event.source!==parent||port||!event.ports[0])return;port=event.ports[0];port.onmessage=e=>{if(e.data.type!=='configure')return;document.documentElement.classList.toggle('dark',e.data.theme==='dark');if(e.data.css){const style=document.createElement('style');style.textContent=e.data.css;document.head.append(style);}const block=e.data.block;globalThis.__cmsSettingsPort=port;mount(Settings,{target:document.getElementById('settings'),props:{block,host:{...e.data.host,MediaPicker},onchange:()=>port.postMessage({type:'change',block})}});};port.start();});`;
      const result = await build({
        stdin: {
          contents: entry,
          resolveDir: directory,
          sourcefile: "entry.js",
        },
        bundle: true,
        minify: true,
        write: false,
        format: "esm",
        platform: "browser",
        mainFields: ["module", "main"],
        target: "es2022",
        conditions:
          kind === "server" ? ["svelte", "worker"] : ["svelte", "browser"],
        plugins: [sveltePlugin],
      });
      await writeFile(resolve(dist, kind + ".js"), result.outputFiles[0].text);
    }
  }
}
export async function buildExample() {
  const directory = resolve(root, "examples/notes");
  await mkdir(resolve(directory, "dist"), { recursive: true });
  const result = await build({
    entryPoints: [resolve(directory, "server.ts")],
    alias: {
      "@mywinkel/block-sdk/server": resolve(root, "packages/sdk/src/server.ts"),
      "@mywinkel/block-sdk/public/website/content": resolve(
        root,
        "packages/sdk/src/public/website/content.ts",
      ),
    },
    bundle: true,
    write: false,
    format: "esm",
    platform: "browser",
    target: "es2022",
    minify: true,
  });
  await writeFile(
    resolve(directory, "dist/server.js"),
    result.outputFiles[0].text,
  );
}
if (import.meta.main) {
  await buildPackages();
  await buildExample();
}
