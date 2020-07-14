import * as fs from "fs";
import * as _ from "./index";
import * as T from "./types";
import * as request from "request";
import * as cheerio from "cheerio";
import * as normalizeUrl from "normalize-url";
import * as writer from "./writer";

// let level = 0;
let crawledPages: T.CrawledPageData[] = [];
let urlsToVisit: URL[] = [];
let emailsFound: T.Email[] = [];
let pagesVisited = 0;
let currentUrl: URL = null;

// append csv headers
fs.appendFileSync(_.PATH_PAGES_DB, `url,status\n`);

urlsToVisit.push(_.START_URL);
crawl();

function crawl() {
  if (pagesVisited >= _.MAX_PAGES_TO_VISIT) {
    console.log();
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

    if (res.statusCode !== 200) {
      callback();
      return;
    }

    const pageData: T.CrawledPageData = { url: url, status: res.statusCode };
    crawledPages.push(pageData);
    writer.add(pageData);
    // fs.appendFileSync(_.PATH_PAGES_DB, `${url},${res.statusCode}\n`);

    pagesVisited++;

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

    // an email was found!
    if (href.includes("mailto:")) {
      const address = href.replace("mailto:", "").toLowerCase();
      // don't push already created emails
      if (!emailsFound.some((email) => email.address === address)) {
        emailsFound.push({
          address,
        });
        // fs.appendFileSync(_.PATH_EMAILS_DB, `${address}\n`);
      }
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
