import * as path from "path";
import * as fs from "fs";
import Mocha from "mocha";

export async function run(): Promise<void> {
  const mocha = new Mocha({
    ui: "tdd",
    color: true,
  });

  const testsRoot = path.resolve(__dirname);

  // Recursively find all .test.js files
  function walk(dir: string): string[] {
    const found: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        found.push(...walk(full));
      } else if (entry.name.endsWith(".test.js")) {
        found.push(full);
      }
    }
    return found;
  }

  const files = walk(testsRoot);
  files.forEach((f) => mocha.addFile(f));

  return new Promise<void>((resolve, reject) => {
    mocha.run((failures) => {
      if (failures > 0) {
        reject(new Error(`${failures} tests failed.`));
      } else {
        resolve();
      }
    });
  });
}
