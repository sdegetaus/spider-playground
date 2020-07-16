import * as fs from "fs";
import * as _ from "./index";
import * as T from "./types";

let queue: T.CrawledData[] = [];

export function add(pageData: T.CrawledData) {
  queue.push(pageData);
  const pd = queue.shift();
  // fs.appendFile(_.PATH_PAGES_DB, `${pd.url},${pd.status}\n`, (error) => {
  //   if (error) throw error;
  // });
  fs.appendFileSync(
    _.PATH_PAGES_DB,
    `${pd.depth},${pd.url},${pd.statusCode}\n`
  );
}

// temp
export function test(a: any) {
  fs.writeFileSync("./public/test.json", `${JSON.stringify(a, null, 1)}`);
}
