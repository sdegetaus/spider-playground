import * as _ from "./index";
import * as T from "./types";
import * as fs from "fs";
import * as request from "request";
import * as cheerio from "cheerio";
import * as normalizeUrl from "normalize-url";

let crawledPages: T.CrawledPageData[] = [];
let urlsToVisit: URL[] = [];
let pagesVisited = 0;
let currentUrl: URL = null;

// append csv headers
fs.appendFileSync(_.OUTPUT_PATH, `url,status\n`);

urlsToVisit.push(_.START_URL);
crawl();

function crawl() {
  if (pagesVisited >= _.MAX_PAGES_TO_VISIT) {
    console.log(`Reached max limit of number of pages to visit.`);
    endReport();
    return;
  }

  const nextUrl = urlsToVisit.shift();
  currentUrl = nextUrl;

  // reached end of links
  if (nextUrl === undefined) {
    endReport();
    return;
  }

  // don't visit if already visited
  if (crawledPages.some((e) => e.url.pathname === nextUrl.pathname)) {
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
    fs.appendFileSync(_.OUTPUT_PATH, `${url},${res.statusCode}\n`);
    pagesVisited++;

    if (res.statusCode !== 200) {
      callback();
      return;
    }
    const $ = cheerio.load(body);
    collectLinks($);
    callback();
  });
}

function collectLinks($: CheerioStatic) {
  const allLinks = $("a[href]");

  allLinks.each(function () {
    const href = $(this).attr("href").trim();
    const isAbsolute = new RegExp("^(?:[a-z]+:)?//", "i").test(href);

    // dont include hrefs with 'tel:', 'javascript:', etc.
    if (_.INVALID_HREFS.some((invalid) => href.includes(invalid))) {
      return true;
    }

    const url = isAbsolute
      ? new URL(normalizeUrl(`${href}`))
      : new URL(
          normalizeUrl(`${currentUrl.protocol}//${currentUrl.hostname}${href}`)
        );

    // dont include urls with params
    if (url.search.length !== 0) {
      return true;
    }

    if (isAbsolute) {
      // don't include some regexed hrefs
      if (!_.EXCLUDED_REGEX.some((re) => re.test(url.host))) {
        urlsToVisit.push(url);
      }
    } else {
      urlsToVisit.push(url);
    }
  });
}

function endReport() {
  console.log();
  console.log(`Pages visited ${pagesVisited}`);
  console.timeEnd();
}
