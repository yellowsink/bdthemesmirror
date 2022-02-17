import cfg from "../cfg.js";
import fetch from "node-fetch";
import repoManifestTemplate from "./repoManifestTemplate.js"

import * as fs from "fs/promises";

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
  await fs.mkdir("dist");
  for (const [content, fileName] of parsedThemes) {
    await fs.writeFile(`dist/${fileName}`, content);

    workingRepo.themes.push(`./${fileName}`);
  }

  await fs.writeFile(`dist/${cfg.REPO_MANIFEST_NAME}`, JSON.stringify(workingRepo));
})();
