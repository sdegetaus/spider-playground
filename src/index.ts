// http://www.netinstructions.com/how-to-make-a-simple-web-crawler-in-javascript-and-node-js/

import * as fs from "fs";
import * as T from "./types";
import * as request from "request";
import * as cheerio from "cheerio";
import * as normalizeUrl from "normalize-url";

const START_URL = new URL("https://taus.mx");
const MAX_PAGES_TO_VISIT = 10;

const DIR_OUTPUT = "./public";
const FILE_OUTPUT = "output.csv";
const FULL_FILE_PATH = `${DIR_OUTPUT}/${FILE_OUTPUT}`;

let crawledPages: T.CrawledPageData[] = [];
let urlsToVisit: URL[] = [];
let numPagesVisited: number = 0;

const EXCLUDED_ORIGINS: RegExp[] = [/microsoft/, /adobe/, /facebook/, /google/];

// -----------------------------------------------

if (!fs.existsSync(DIR_OUTPUT)) {
  fs.mkdirSync(DIR_OUTPUT);
}

if (fs.existsSync(FULL_FILE_PATH)) {
  fs.unlinkSync(FULL_FILE_PATH);
}

fs.appendFileSync(FULL_FILE_PATH, `url,status\n`);

urlsToVisit.push(START_URL);
crawl();

function crawl() {
  if (numPagesVisited >= MAX_PAGES_TO_VISIT) {
    console.log(`Reached max limit of number of pages to visit.`);
    exitProcess();
  }

  const nextUrl: URL = urlsToVisit.pop();

  // reached end of links
  if (nextUrl === undefined) {
    exitProcess();
  }

  if (
    crawledPages.some((e: T.CrawledPageData) => e.url.href === nextUrl.href)
  ) {
    crawl();
    return;
  }

  visitPage(nextUrl, crawl);
}

function visitPage(url: URL, callback: Function) {
  console.log();
  console.log(`Visiting page ${url}`);

  request(url.toString(), (error, res, body) => {
    if (error) {
      console.log(`Error reported: ${error}`);
      callback();
      return;
    }

    console.log(`Status code: ${res.statusCode}`);

    crawledPages.push({ url: url, status: res.statusCode });
    fs.appendFileSync(FULL_FILE_PATH, `${url},${res.statusCode}\n`);
    numPagesVisited++;

    if (res.statusCode !== 200) {
      callback();
      return;
    }
    let $ = cheerio.load(body);
    collectRelativeLinks($);
    collectAbsoluteLinks($);
    callback();
  });
}

function collectRelativeLinks($) {
  const relativeLinks = $("a[href^='/']");
  console.log(`Found ${relativeLinks.length} relative links on page`);
  relativeLinks.each(function () {
    urlsToVisit.push(
      new URL(
        normalizeUrl(
          `${START_URL.protocol}//${START_URL.hostname}${$(this).attr("href")}`
        )
      )
    );
  });
}

function collectAbsoluteLinks($) {
  const absoluteLinks = $("a[href^='http']");
  console.log(`Found ${absoluteLinks.length} absolute links on page`);
  absoluteLinks.each(function () {
    const url = new URL(normalizeUrl(`${$(this).attr("href")}`));
    if (!EXCLUDED_ORIGINS.some((regex) => regex.test(url.origin))) {
      urlsToVisit.push(url);
    }
  });
}

function exitProcess() {
  console.log();
  console.log(`Pages visited ${numPagesVisited}`, JSON.stringify(crawledPages));
  process.exit(0);
}
