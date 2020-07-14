import * as _ from "./index";
import * as T from "./types";
import * as fs from "fs";
import * as request from "request";
import * as cheerio from "cheerio";
import * as normalizeUrl from "normalize-url";

let crawledPages: T.CrawledPageData[] = [];
let urlsToVisit: URL[] = [];
let pagesVisited = 0;

if (!fs.existsSync(_.DIR_OUTPUT)) {
  fs.mkdirSync(_.DIR_OUTPUT);
}

if (fs.existsSync(_.FULL_FILE_PATH)) {
  fs.unlinkSync(_.FULL_FILE_PATH);
}

fs.appendFileSync(_.FULL_FILE_PATH, `url,status\n`);

let currentUrl = new URL(_.START_URL.toString());
urlsToVisit.push(_.START_URL);
crawl();

function crawl() {
  if (pagesVisited >= _.MAX_PAGES_TO_VISIT) {
    console.log(`Reached max limit of number of pages to visit.`);
    endReport();
    return;
  }

  const nextUrl = urlsToVisit.pop();

  currentUrl = nextUrl;
  console.log("######", currentUrl.origin);

  // reached end of links
  if (nextUrl === undefined) {
    endReport();
    return;
  }

  if (crawledPages.some((e) => e.url.href === nextUrl.href)) {
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
    fs.appendFileSync(_.FULL_FILE_PATH, `${url},${res.statusCode}\n`);
    pagesVisited++;

    if (res.statusCode !== 200) {
      callback();
      return;
    }
    let $ = cheerio.load(body);

    collectLinks($);
    callback();
  });
}

function collectLinks($: CheerioStatic) {
  const test = $("a[href^='/']");
  test.each(function () {
    console.log($(this).attr("href"));
  });

  const relativeLinks = $("a[href^='/']");
  const absoluteLinks = $("a[href^='http']");

  console.log(`Found ${relativeLinks.length} relative links on page`);
  console.log(`Found ${absoluteLinks.length} absolute links on page`);

  relativeLinks.each(function () {
    urlsToVisit.push(
      new URL(
        normalizeUrl(
          `${currentUrl.protocol}//${currentUrl.hostname}${$(this).attr(
            "href"
          )}`
        )
      )
    );
  });

  absoluteLinks.each(function () {
    const url = new URL(normalizeUrl(`${$(this).attr("href")}`));
    if (!_.EXCLUDED_ORIGINS.some((regex) => regex.test(url.origin))) {
      urlsToVisit.push(url);
    }
  });
}

function endReport() {
  console.log();
  console.log(`Pages visited ${pagesVisited}`);
}
