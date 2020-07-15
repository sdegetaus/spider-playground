export interface CrawledPageData {
  url: URL;
  status: number;
}

export interface Email {
  address: string;
}

export interface Node {
  url: URL;
  others?: Node[];
}
