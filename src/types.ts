export interface CrawledData {
  url: URL;
  status: number;
}

export interface Vertex {
  url: URL;
  edges: Vertex[];
}
