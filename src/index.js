const request = require("request");
const cheerio = require("cheerio");

const START_URL = new URL("https://taus.mx");

let pagesVisited = {};
let numPagesVisited = 0;
let pagesToVisit = [];

pagesToVisit.push(START_URL.toString());
crawl();

function crawl() {
  var nextPage = pagesToVisit.pop();

  if (nextPage === undefined) {
    console.log(`Pages visited ${numPagesVisited}`, pagesVisited);
    process.exit(0);
  }

  if (nextPage in pagesVisited) {
    crawl();
  } else {
    visitPage(nextPage, crawl);
  }
}

function visitPage(url, callback) {
  pagesVisited[url] = true;
  numPagesVisited++;

  console.log("Visiting page " + url);
  request(url, function (error, response, body) {
    console.log("Status code: " + response.statusCode);
    if (response.statusCode !== 200) {
      callback();
      return;
    }
    let $ = cheerio.load(body);
    collectInternalLinks($);
    callback();
  });
}

function collectInternalLinks($) {
  let relativeLinks = $("a[href^='/']");
  console.log(`Found ${relativeLinks.length} relative links on page`);
  relativeLinks.each(function () {
    pagesToVisit.push(
      `${START_URL.protocol}//${START_URL.hostname}${$(this).attr("href")}`
    );
  });
}
