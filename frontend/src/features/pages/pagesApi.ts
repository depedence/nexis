import { apiClient } from "../../shared/api/apiClient";
import type { CreatePageRequest, PageDto, UpdatePageRequest } from "../../shared/types/page";

export function getPages(signal?: AbortSignal) {
  return apiClient<PageDto[]>("/pages", { signal });
}

export function createPage(payload: CreatePageRequest) {
  return apiClient<PageDto>("/pages", {
    method: "POST",
    body: payload
  });
}

export function updatePage(pageId: number, payload: UpdatePageRequest) {
  return apiClient<PageDto>(`/pages/${pageId}`, {
    method: "PATCH",
    body: payload
  });
}

export function deletePage(pageId: number) {
  return apiClient<void>(`/pages/${pageId}`, {
    method: "DELETE"
  });
}
