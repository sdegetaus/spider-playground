import * as fs from "fs";
import * as _ from "./index";
import * as T from "./types";
import * as request from "request-promise";
import * as cheerio from "cheerio";
import * as normalizeUrl from "normalize-url";
import * as writer from "./writer";

let crawledPages: T.CrawledData[] = [];
let pagesVisited = 0;

const runFor = 2; // temp

const origin: T.Vertex = {
  url: _.START_URL,
  edges: [],
};

// append csv headers
// temp
// fs.appendFileSync(_.PATH_PAGES_DB, `url,status\n`);

(async () => {
  console.time();

  await visit(origin);

  for (let i = 0; i < origin.edges.length; i++) {
    // if (pagesVisited >= _.MAX_PAGES_TO_VISIT) {
    //   console.log();
    //   console.log(`Reached max limit of number of pages to visit.`);
    //   break;
    // }
    const next = origin.edges[i];
    // dont visit if already visited
    if (crawledPages.some((e) => e.url.href === next.url.href)) {
      continue;
    }
    await visit(next)
      .then(() => pagesVisited++)
      .catch((e) => {
        throw e;
      });
  }

  writer.test(origin);

  console.log();
  console.log(`Pages visited ${pagesVisited}`);
  console.timeEnd();
})();

async function visit(from: T.Vertex) {
  console.log();
  console.log(`[${pagesVisited}]: Visiting page ${from.url}`);

  const options = {
    uri: from.url.toString(),
    resolveWithFullResponse: true,
  };

  await request(options)
    .then(({ body, statusCode }) => {
      const pageData = {
        url: from.url,
        statusCode,
      };

      crawledPages.push(pageData);
      collectLinks(from, cheerio.load(body));
    })
    .catch((error) => {
      console.log(`Error reported: ${error}`);
    });
}

function collectLinks(from: T.Vertex, $: CheerioStatic) {
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
          normalizeUrl(`${from.url.protocol}//${from.url.hostname}${href}`)
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
        from.edges.push({ url, edges: [] });
      }
    } else {
      from.edges.push({ url, edges: [] });
    }
  });
}
