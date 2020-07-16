import * as fs from "fs";
import * as _ from "./index";
import * as T from "./types";
import * as rp from "request-promise";
import * as cheerio from "cheerio";
import * as normalizeUrl from "normalize-url";
import * as writer from "./writer";

let crawledPages: T.CrawledData[] = [];
let pagesVisited = 0;

const runFor = 2;

const head: T.Vertex[] = [
  {
    url: _.START_URL,
    edges: [],
  },
];

let curr: T.Vertex;

// append csv headers
// temp
// fs.appendFileSync(_.PATH_PAGES_DB, `url,status\n`);

(async () => {
  console.time();
  let i = 0;

  while (true) {
    if (i >= runFor) {
      console.log();
      console.log(`Reached max limit of iterations.`);
      break;
    }

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
    curr = head[0];

    // dont visit if already visited
    if (crawledPages.some((e) => e.url.href === curr.url.href)) {
      continue;
    }

    console.log();
    console.log(`Visiting page ${curr.url}`);

    const options = {
      uri: curr.url.toString(),
      resolveWithFullResponse: true,
    };

    await rp(options)
      .then(({ body, statusCode }) => {
        const pageData = {
          url: curr.url,
          status: statusCode,
        };

        pagesVisited++;
        crawledPages.push(pageData);
        // writer.add(pageData);
        collectLinks(cheerio.load(body));

        if (i == 1) {
          writer.test(head);
          process.exit(0);
        }

        while (curr.edges.length > 0) {
          head.push(curr.edges.shift());
        }
        head.shift();
        writer.test(head);
        // process.exit(0);
      })
      .catch((error) => {
        console.log(`Error reported: ${error}`);
      });
    i++;
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
          normalizeUrl(`${curr.url.protocol}//${curr.url.hostname}${href}`)
        );

    // dont include urls with params
    if (url.search.length !== 0) {
      return true;
    }

    // todo: better solution?
    if (url.href === _.START_URL.href) {
      return true;
    }

    // todo: necessary?
    if (crawledPages.some((_) => _.url.href === url.href)) {
      return true;
    }

    if (isAbsolute) {
      // don't include some regexed hrefs
      if (!_.EXCLUDED_REGEX.some((re) => re.test(url.host))) {
        curr.edges.push({ url, edges: [] });
      }
    } else {
      curr.edges.push({ url, edges: [] });
    }
  });
}
