import cfg from "../cfg.ts";
import repoManifestTemplate from "./repoManifestTemplate.ts";

import { emptyDir } from "https://deno.land/std@0.126.0/fs/mod.ts";

(async () => {
  const themes = await (await fetch(cfg.BD_THEMES_URL)).json();

  if (!Array.isArray(themes)) return console.log("invalid json");

  const parsedThemes: [string, string][] = [];

  for (const theme of themes.slice(0, 3)) {
    const id: number = theme.id;
    const req = await fetch(cfg.BD_DOWNLOAD_URL + id);

    if (req.status !== 200)
      return console.log(req.status, req.headers, await req.text());

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
})();
