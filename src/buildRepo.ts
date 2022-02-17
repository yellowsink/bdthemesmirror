import cfg from "../cfg.ts";
import repoManifestTemplate from "./repoManifestTemplate.ts";

import { emptyDir } from "https://deno.land/std@0.126.0/fs/mod.ts";

const themes = await (await fetch(cfg.BD_THEMES_URL)).json();

if (!Array.isArray(themes)) {
  console.error("invalid json");
  Deno.close(1);
}

const parsedThemes: [string, string][] = [];

for (const theme of themes) {
  const id: number = theme.id;
  console.log("Building theme with ID #" + id);

  let req;
  while (!req) {
    try {
      req = await fetch(cfg.BD_DOWNLOAD_URL + id);
    } catch (error) {
      if (!(error instanceof TypeError) || !error.message.includes("redirects"))
        throw error;

      console.warn("!!!! Max redirects error, retrying req");
    }
  }

  if (req.status !== 200) {
    console.error(req.status, req.headers, await req.text());
    Deno.close(2);
  }

  const content = await req.text();

  const fullFileName: string = theme.latest_source_url;
  const fileNameSplit = fullFileName.split("/");
  const fileName = fileNameSplit[fileNameSplit.length - 1];

  parsedThemes.push([content, fileName]);
}

const workingRepo = repoManifestTemplate;
await emptyDir("dist");
for (const [content, fileName] of parsedThemes) {
  await Deno.writeTextFile(`dist/${fileName}`, content);

  workingRepo.themes.push(`./${fileName}`);
}

await Deno.writeTextFile(
  `dist/${cfg.REPO_MANIFEST_NAME}`,
  JSON.stringify(workingRepo)
);