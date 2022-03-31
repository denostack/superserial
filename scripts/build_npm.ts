import { build, emptyDir } from "https://deno.land/x/dnt@0.22.0/mod.ts";

const cmd = Deno.run({ cmd: ["git", "describe", "--tags"], stdout: "piped" });
const version = new TextDecoder().decode(await cmd.output()).trim();
cmd.close();

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
    version,
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
