import * as fs from "fs";
import * as _ from "./index";
import * as T from "./types";
import * as rp from "request-promise";
import * as cheerio from "cheerio";
import * as normalizeUrl from "normalize-url";
import * as writer from "./writer";

let crawledPages: T.CrawledData[] = [];
let pagesVisited = 0;

const head: T.Vertex = {
  url: _.START_URL,
  edges: [],
};

// append csv headers
fs.appendFileSync(_.PATH_PAGES_DB, `url,status\n`);

(async () => {
  console.time();

  while (true) {
    if (pagesVisited >= _.MAX_PAGES_TO_VISIT) {
      console.log();
      console.log(`Reached max limit of number of pages to visit.`);
      break;
    }

    // const next = head.edges.shift();

    // // reached end of links
    // if (next === undefined) {
    //   break;
    // }

    // currentUrl = next.url;

    // dont visit if already visited
    // if (crawledPages.some((e) => e.url.pathname === head.url.pathname)) {
    //   continue;
    // }

    console.log();
    console.log(`Visiting page ${head.url}`);

    const options = {
      uri: head.url.toString(),
      resolveWithFullResponse: true,
    };

    await rp(options)
      .then(({ body, statusCode }) => {
        const pageData = {
          url: head.url,
          status: statusCode,
        };

        pagesVisited++;
        crawledPages.push(pageData);
        writer.add(pageData);
        collectLinks(cheerio.load(body));

        // while (head.edges.length > 0) {
        //   const next = head.edges.shift();
        //   // console.log(next.url.toString());
        // }
        console.log(head);
        process.exit(0);
      })
      .catch((error) => {
        console.log(`Error reported: ${error}`);
      });
  }

  console.log();
  console.log(`Pages visited ${pagesVisited}`);
  console.timeEnd();
})();

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
          normalizeUrl(`${head.url.protocol}//${head.url.hostname}${href}`)
        );

    // dont include urls with params
    if (url.search.length !== 0) {
      return true;
    }

    console.log("-- " + url.toString());

    if (isAbsolute) {
      // don't include some regexed hrefs
      if (!_.EXCLUDED_REGEX.some((re) => re.test(url.host))) {
        head.edges.push({ url, edges: [] });
      }
    } else {
      head.edges.push({ url, edges: [] });
    }
  });
}
