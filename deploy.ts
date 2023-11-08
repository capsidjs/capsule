import { lookup } from "https://deno.land/x/media_types/mod.ts";

console.log("Visit http://localhost:8000/");
Deno.serve(async ({ url }) => {
  let path = "." + new URL(url).pathname;
  if (path.endsWith("/")) {
    path += "index.html";
  }
  return new Response(await Deno.readFile(path), {
    headers: { "content-type": lookup(path) || "application/octet-stream" },
  });
});
