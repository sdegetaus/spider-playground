import * as fs from "fs";

const dir = "./public";

try {
  if (fs.existsSync(`${dir}`)) {
    fs.rmdirSync(`${dir}`, { recursive: true });
    console.log(`Removed "${dir}"`);
  } else {
    console.log(`Couldn't find path "${dir}"`);
  }
} catch (error) {
  console.error(`Error while deleting path "${dir}". More info below.`);
  throw new Error(error);
} finally {
  console.log();
}
