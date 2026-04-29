export type PageType = "NOTE" | "COLLECTION";

export type PageDto = {
  id: number;
  parentId: number | null;
  title: string;
  content: string | null;
  type: PageType;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export type CreatePageRequest = {
  parentId: number | null;
  title: string;
  content: string | null;
  type: PageType;
  position: number;
};

export type UpdatePageRequest = {
  title: string;
  content: string | null;
};
