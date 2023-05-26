import { build, emptyDir } from "dnt/mod.ts";
import { bgGreen } from "fmt/colors.ts";

const denoInfo = JSON.parse(
  Deno.readTextFileSync(new URL("../deno.json", import.meta.url)),
);
const version = denoInfo.version;

console.log(bgGreen(`version: ${version}`));

await emptyDir("./.npm");

await build({
  entryPoints: ["./mod.ts"],
  outDir: "./.npm",
  shims: {
    deno: false,
  },
  test: false,
  compilerOptions: {
    lib: ["es2021", "dom"],
  },
  package: {
    name: "superserial",
    version,
    description:
      "A comprehensive Serializer/Deserializer that can handle any data type.",
    keywords: [
      "serialize",
      "serializer",
      "serialization",
      "JSON",
      "flatted",
      "circular",
    ],
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
