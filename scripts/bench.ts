import ansiToSvg from "ansi-to-svg";

const cmd = Deno.run({
  cmd: ["deno", "bench"],
  stdout: "piped",
  stderr: "piped",
});

const decoder = new TextDecoder();
const output = decoder.decode(await cmd.output());

const svg: string = ansiToSvg(output, {
  paddingTop: 4,
  paddingBottom: 4,
  paddingLeft: 8,
  paddingRight: 8,
});

await Deno.writeTextFile("./.benchmark/output.svg", svg);
