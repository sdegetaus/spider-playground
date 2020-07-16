export interface CrawledData {
  depth: number;
  url: URL;
  statusCode: number;
}

export interface Vertex {
  url: URL;
  edges: Vertex[];
}
