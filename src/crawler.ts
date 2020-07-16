import * as fs from "fs";
import * as _ from "./index";
import * as T from "./types";
import * as request from "request-promise";
import * as cheerio from "cheerio";
import * as normalizeUrl from "normalize-url";
import * as writer from "./writer";

let pagesVisited = 0;
let allCrawledPages: T.CrawledData[] = [];

// append csv headers
fs.appendFileSync(_.PATH_PAGES_DB, `depth,url,status\n`);

(async () => {
  let hrstart = process.hrtime();

  const origin: T.Vertex = {
    url: _.START_URL,
    edges: [],
  };

  origin.edges = await visit(origin.url, 0);

  for (let i = 0; i < origin.edges.length; i++) {
    const next = origin.edges[i];
    if (allCrawledPages.some((_) => _.url.href === next.url.href)) continue; // dont visit if already visited
    next.edges = await visit(next.url, 1);
  }

  writer.saveTree(origin);

  console.log();
  console.log(`Pages visited ${pagesVisited}`);

  let hrend = process.hrtime(hrstart);
  console.info("Execution time: %ds %dms", hrend[0], hrend[1] / 1000000);
})();

async function visit(url: URL, depth: number) {
  console.log();
  console.log(`[${pagesVisited}]: Visiting page ${url}`);

  const options = {
    uri: url.toString(),
    resolveWithFullResponse: true,
  };

  return await request(options)
    .then(({ body, statusCode }): T.Vertex[] => {
      const pageData: T.CrawledData = {
        depth,
        url,
        statusCode,
      };
      pagesVisited++;
      writer.add(pageData);
      allCrawledPages.push(pageData);
      return collectLinks(url, cheerio.load(body));
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
    if (_.INVALID_HREFS.some((invalid) => href.includes(invalid))) return true;

    const url = isAbsolute
      ? new URL(normalizeUrl(`${href}`))
      : new URL(
          normalizeUrl(`${fromUrl.protocol}//${fromUrl.hostname}${href}`)
        );

    // dont include urls with params
    if (url.search.length !== 0) return true;

    // dont include urls to this same page
    if (url.href === fromUrl.href) return true;

    // dont include duplicate link in the same page
    if (collected.some((_) => _.url.href === url.href)) return true;

    if (isAbsolute) {
      // dont include some regexed hrefs
      if (!_.EXCLUDED_REGEX.some((re) => re.test(url.host))) {
        collected.push({ url, edges: [] });
      }
    } else {
      collected.push({ url, edges: [] });
    }
  });

  return collected;
}
