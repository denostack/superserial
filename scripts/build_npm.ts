import { build, emptyDir } from "https://deno.land/x/dnt@0.22.0/mod.ts";

await emptyDir("./.npm");

await build({
  entryPoints: ["./mod.ts"],
  outDir: "./.npm",
  shims: {
    deno: false,
  },
  test: false,
  package: {
    name: "superserial",
    version: Deno.args[0],
    description:
      "superserial provides serialization in any way you can imagine",
    keywords: ["serialize", "JSON", "flatted", "circular"],
    license: "MIT",
    repository: {
      type: "git",
      url: "git+https://github.com/denostack/superserial.git",
    },
    bugs: {
      url: "https://github.com/denostack/superserial/issues",
    },
  },
});

// post build steps
Deno.copyFileSync("README.md", ".npm/README.md");
