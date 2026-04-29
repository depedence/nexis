import { apiClient } from "../../shared/api/apiClient";
import type { CreatePageRequest, PageDto, UpdatePageRequest } from "../../shared/types/page";

export function getRootPages(signal?: AbortSignal) {
  return apiClient<PageDto[]>("/pages/root", { signal });
}

export function getPageChildren(pageId: number, signal?: AbortSignal) {
  return apiClient<PageDto[]>(`/pages/${pageId}/children`, { signal });
}

export function getPage(pageId: number, signal?: AbortSignal) {
  return apiClient<PageDto>(`/pages/${pageId}`, { signal });
}

export function searchPages(query: string, signal?: AbortSignal) {
  return apiClient<PageDto[]>(`/pages/search?q=${encodeURIComponent(query)}`, { signal });
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
