import * as fs from "fs";
import * as _ from "./index";
import * as T from "./types";

let queue: T.CrawledPageData[] = [];

export function add(pageData: T.CrawledPageData) {
  queue.push(pageData);
  const pd = queue.shift();
  fs.appendFile(_.PATH_PAGES_DB, `${pd.url},${pd.status}\n`, (error) => {
    if (error) throw error;
  });
}