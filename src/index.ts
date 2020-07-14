// http://www.netinstructions.com/how-to-make-a-simple-web-crawler-in-javascript-and-node-js/

import * as fs from "fs";

console.time();

// create directory & create csv file
const DIR_OUTPUT = "./public";
if (!fs.existsSync(DIR_OUTPUT)) {
  fs.mkdirSync(DIR_OUTPUT);
}
const FILE_OUTPUT = `output-${fs
  .readdirSync(DIR_OUTPUT)
  .length.toString()
  .padStart(2, "0")}.csv`;
export const OUTPUT_PATH = `${DIR_OUTPUT}/${FILE_OUTPUT}`;
if (fs.existsSync(OUTPUT_PATH)) {
  fs.unlinkSync(OUTPUT_PATH);
}

export const START_URL = new URL("https://taus.mx");
export const MAX_PAGES_TO_VISIT = 50;
export const EXCLUDED_REGEX: RegExp[] = [
  /microsoft/,
  /adobe/,
  /facebook/,
  /google/,
  /github.com\/.+?\/.+?\/(issues|pulls|actions|projects|security|pulse|find|commits|branches|tags|tree|blob|releases|graphs|search)/,
];

export const INVALID_HREFS: string[] = ["javascript:", "tel:", "mailto:"];

require("./crawler");
