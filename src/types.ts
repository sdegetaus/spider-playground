export interface CrawledData {
  url: URL;
  statusCode: number;
}

export interface Vertex {
  url: URL;
  edges: Vertex[];
}
