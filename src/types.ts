export interface NotionPage {
  id: string;
  created_time: string;
  last_edited_time: string;
  properties: Record<string, any>;
}

export interface DatabaseResponse {
  results: NotionPage[];
  next_cursor: string | null;
  has_more: boolean;
}