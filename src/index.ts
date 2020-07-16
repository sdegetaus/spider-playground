// I started following this tutorial:
// http://www.netinstructions.com/how-to-make-a-simple-web-crawler-in-javascript-and-node-js/

import * as fs from "fs";

export const START_URL = new URL("https://taus.mx");
export const MAX_PAGES_TO_VISIT = 3;
export const EXCLUDED_REGEX: RegExp[] = [
  // exclude github repo paths
  /github.com\/.+?\/.+?\/(issues|pulls|actions|projects|security|pulse|find|commits|branches|tags|tree|blob|releases|graphs|search)/,
];

export const INVALID_HREFS: string[] = ["javascript:", "tel:"];

// create directories & create csv files
if (!fs.existsSync("./public")) {
  fs.mkdirSync("./public");
}

const DIR_OUTPUT_DB = "./public";

const FILE_PAGES_DB = `output-${fs
  .readdirSync(DIR_OUTPUT_DB)
  .length.toString()
  .padStart(2, "0")}.csv`;

export const PATH_PAGES_DB = `${DIR_OUTPUT_DB}/${FILE_PAGES_DB}`;

if (fs.existsSync(PATH_PAGES_DB)) {
  fs.unlinkSync(PATH_PAGES_DB);
}

require("./crawler");
