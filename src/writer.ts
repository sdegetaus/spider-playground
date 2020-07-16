import * as fs from "fs";
import * as _ from "./index";
import * as T from "./types";

let queue: T.CrawledData[] = [];

export function add(pageData: T.CrawledData) {
  queue.push(pageData);
  const pd = queue.shift();
  fs.appendFile(
    _.PATH_PAGES_DB,
    `${pd.depth},${pd.url},${pd.statusCode}\n`,
    (error) => {
      if (error) throw error;
    }
  );
}

export function saveTree(a: any) {
  fs.writeFileSync("./public/tree.json", `${JSON.stringify(a, null, 1)}`);
}
