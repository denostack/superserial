import { build, emptyDir } from "@deno/dnt";
import { bgGreen } from "@std/fmt/colors";

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
    lib: ["ES2021", "DOM"],
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
