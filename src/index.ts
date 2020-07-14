// http://www.netinstructions.com/how-to-make-a-simple-web-crawler-in-javascript-and-node-js/

import * as fs from "fs";

console.time();

const DIR_OUTPUT = "./public";

// create directory
if (!fs.existsSync(DIR_OUTPUT)) {
  fs.mkdirSync(DIR_OUTPUT);
}

const FILE_OUTPUT = `output-${fs
  .readdirSync(DIR_OUTPUT)
  .length.toString()
  .padStart(2, "0")}.csv`;
export const OUTPUT_PATH = `${DIR_OUTPUT}/${FILE_OUTPUT}`;

// create csv file
if (fs.existsSync(OUTPUT_PATH)) {
  fs.unlinkSync(OUTPUT_PATH);
}

export const START_URL = new URL("https://taus.mx");
export const MAX_PAGES_TO_VISIT = 5;
export const EXCLUDED_ORIGINS: RegExp[] = [
  /microsoft/,
  /adobe/,
  /facebook/,
  /google/,
];

require("./crawler");
