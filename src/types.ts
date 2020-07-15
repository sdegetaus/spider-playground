export interface CrawledData {
  url: URL;
  status: number;
}

export interface Email {
  address: string;
}

export interface Vertex {
  url: URL;
  edges: Vertex[];
}
