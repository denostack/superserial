import ansiToSvg from "ansi-to-svg";

const cmd = new Deno.Command("deno", {
  args: ["bench"],
  stdout: "piped",
  stderr: "piped",
});

const commandOutput = await cmd.spawn().output();

const decoder = new TextDecoder();
const output = decoder.decode(commandOutput.stdout);

const svg: string = ansiToSvg(output, {
  paddingTop: 4,
  paddingBottom: 4,
  paddingLeft: 8,
  paddingRight: 8,
});

await Deno.writeTextFile("./.benchmark/output.svg", svg);
