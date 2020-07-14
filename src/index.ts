// http://www.netinstructions.com/how-to-make-a-simple-web-crawler-in-javascript-and-node-js/

export const DIR_OUTPUT = "./public";
export const FILE_OUTPUT = "output.csv";
export const FULL_FILE_PATH = `${DIR_OUTPUT}/${FILE_OUTPUT}`;

export const START_URL = new URL("https://taus.mx");
export const MAX_PAGES_TO_VISIT = 10;
export const EXCLUDED_ORIGINS: RegExp[] = [
  /microsoft/,
  /adobe/,
  /facebook/,
  /google/,
];

require("./crawler");
