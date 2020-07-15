import * as fs from "fs";
import * as _ from "./index";
import * as T from "./types";
import * as rp from "request-promise";
import * as cheerio from "cheerio";
import * as normalizeUrl from "normalize-url";
import * as writer from "./writer";

// let level = 0;
let crawledPages: T.CrawledPageData[] = [];
let urlsToVisit: T.Node[] = [];
let emailsFound: T.Email[] = [];
let pagesVisited = 0;
let currentUrl: URL = null;

// append csv headers
fs.appendFileSync(_.PATH_PAGES_DB, `url,status\n`);

(async () => {
  console.time();
  urlsToVisit.push({ url: _.START_URL, others: [] });
  urlsToVisit.push({ url: _.START_URL, others: [] });

  while (urlsToVisit.length > 0) {
    if (pagesVisited >= _.MAX_PAGES_TO_VISIT) {
      console.log();
      console.log(`Reached max limit of number of pages to visit.`);
      break;
    }
    const next = urlsToVisit.shift();
    currentUrl = next.url;

    // reached end of links
    if (next === undefined) {
      break;
    }

    console.log();
    console.log(`Visiting page ${next.url}`);

    const options = {
      uri: next.url.toString(),
      resolveWithFullResponse: true,
      transform2xxOnly: true,
    };

    await rp(options)
      .then(({ body, statusCode }) => {
        const pageData = {
          url: next.url,
          status: statusCode,
        };
        pagesVisited++;
        crawledPages.push(pageData);
        writer.add(pageData);
        collectLinks(cheerio.load(body));
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
          normalizeUrl(`${currentUrl.protocol}//${currentUrl.hostname}${href}`)
        );

    // dont include urls with params
    if (url.search.length !== 0) {
      return true;
    }

    // an email was found!
    // if (href.includes("mailto:")) {
    //   const address = href.replace("mailto:", "").toLowerCase();
    //   // don't push already created emails
    //   if (!emailsFound.some((email) => email.address === address)) {
    //     emailsFound.push({
    //       address,
    //     });
    //     // fs.appendFileSync(_.PATH_EMAILS_DB, `${address}\n`);
    //   }
    //   return true;
    // }
    console.log(JSON.stringify(urlsToVisit, null, 2));

    if (isAbsolute) {
      // don't include some regexed hrefs
      if (!_.EXCLUDED_REGEX.some((re) => re.test(url.host))) {
        // urlsToVisit.push({ url });
        urlsToVisit[urlsToVisit.length - 1].others.push({ url });
      }
    } else {
      // urlsToVisit.push({ url });
      urlsToVisit[urlsToVisit.length - 1].others.push({ url });
    }
    console.log(urlsToVisit);
  });
}
