import * as fs from "fs";
import * as _ from "./index";
import * as T from "./types";
import * as request from "request-promise";
import * as cheerio from "cheerio";
import * as normalizeUrl from "normalize-url";
import * as writer from "./writer";

let crawledPages: T.CrawledData[] = [];
let pagesVisited = 0;

// append csv headers
// fs.appendFileSync(_.PATH_PAGES_DB, `url,status\n`);

(async () => {
  console.time();

  const origin: T.Vertex = {
    url: _.START_URL,
    edges: [],
  };

  origin.edges = await visit(origin.url);

  for (let i = 0; i < origin.edges.length; i++) {
    if (pagesVisited >= _.MAX_PAGES_TO_VISIT) {
      console.log();
      console.log(`Reached max limit of number of pages to visit.`);
      break;
    }
    const next = origin.edges[i];

    // dont visit if already visited
    if (crawledPages.some((e) => e.url.href === next.url.href)) {
      continue;
    }
    next.edges = await visit(next.url);
  }

  writer.test(origin);

  console.log();
  console.log(`Pages visited ${pagesVisited}`);
  console.timeEnd();
})();

async function visit(fromUrl: URL) {
  console.log();
  console.log(`[${pagesVisited}]: Visiting page ${fromUrl}`);

  const options = {
    uri: fromUrl.toString(),
    resolveWithFullResponse: true,
  };

  return await request(options)
    .then(({ body, statusCode }): T.Vertex[] => {
      const pageData: T.CrawledData = {
        url: fromUrl,
        statusCode,
      };
      pagesVisited++;
      crawledPages.push(pageData);
      return collectLinks(fromUrl, cheerio.load(body));
    })
    .catch((error) => {
      throw error;
    });
}

function collectLinks(fromUrl: URL, $: CheerioStatic): T.Vertex[] {
  const allLinks = $("a[href]");
  let collected: T.Vertex[] = [];

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
          normalizeUrl(`${fromUrl.protocol}//${fromUrl.hostname}${href}`)
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
    if (crawledPages.some((_) => _.url.href === url.href)) return true;
    if (collected.some((_) => _.url.href === url.href)) return true;

    if (isAbsolute) {
      // don't include some regexed hrefs
      if (!_.EXCLUDED_REGEX.some((re) => re.test(url.host))) {
        collected.push({ url, edges: [] });
      }
    } else {
      collected.push({ url, edges: [] });
    }
  });

  return collected;
}
