// http://www.netinstructions.com/how-to-make-a-simple-web-crawler-in-javascript-and-node-js/

import * as fs from "fs";
console.time();

export const START_URL = new URL("https://taus.mx");
export const MAX_PAGES_TO_VISIT = 50;
export const EXCLUDED_REGEX: RegExp[] = [
  // exclude github repo paths
  /github.com\/.+?\/.+?\/(issues|pulls|actions|projects|security|pulse|find|commits|branches|tags|tree|blob|releases|graphs|search)/,
];

export const INVALID_HREFS: string[] = ["javascript:", "tel:"];

// create directories & create csv files
if (!fs.existsSync("./public")) {
  fs.mkdirSync("./public");
}

const DIR_PAGES_DB = "./public/pages";
if (!fs.existsSync(DIR_PAGES_DB)) {
  fs.mkdirSync(DIR_PAGES_DB);
}

const DIR_EMAILS_DB = "./public/emails";
if (!fs.existsSync(DIR_EMAILS_DB)) {
  fs.mkdirSync(DIR_EMAILS_DB);
}

const FILE_PAGES_DB = `pages-${fs
  .readdirSync(DIR_PAGES_DB)
  .length.toString()
  .padStart(2, "0")}.csv`;

const FILE_EMAILS_DB = `emails-${fs
  .readdirSync(DIR_EMAILS_DB)
  .length.toString()
  .padStart(2, "0")}.csv`;

export const PATH_PAGES_DB = `${DIR_PAGES_DB}/${FILE_PAGES_DB}`;
export const PATH_EMAILS_DB = `${DIR_EMAILS_DB}/${FILE_EMAILS_DB}`;

if (fs.existsSync(PATH_PAGES_DB)) {
  fs.unlinkSync(PATH_PAGES_DB);
}

if (fs.existsSync(PATH_EMAILS_DB)) {
  fs.unlinkSync(PATH_EMAILS_DB);
}

require("./crawler");
