export interface B24Comment {
  ID: string;
  ENTITY_ID: string;
  ENTITY_TYPE: string;
  CREATED: string;
  COMMENT: string;
  AUTHOR_ID: string;
  FILES: Record<string, B24CommentFileOptions>;
}

export interface B24CommentFileOptions {
  id: number;
  date: string;
  type: string;
  name: string;
  size: number;
  image: {
    width: number;
    height: number;
  };
  authorId: number;
  authorName: string;
  urlPreview: string;
  urlShow: string;
  urlDownload: string;
}
