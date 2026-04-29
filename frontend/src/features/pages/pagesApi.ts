import { apiClient } from "../../shared/api/apiClient";
import { API_BASE_URL } from "../../shared/api/config";
import type { CreatePageRequest, PageDto, UpdatePageRequest } from "../../shared/types/page";

type ExportPageFallback = Pick<PageDto, "title" | "type">;

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

export async function exportPage(
  pageId: number,
  fallbackPage?: ExportPageFallback
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/pages/${pageId}/export`);

  if (!response.ok) {
    throw new Error(await readExportError(response));
  }

  const blob = await response.blob();
  const filenameFromHeader = getFilenameFromContentDisposition(
    response.headers.get("Content-Disposition")
  );
  const fallback = fallbackPage ?? (filenameFromHeader ? undefined : await readFallbackPage(pageId));
  const filename = filenameFromHeader ?? getFallbackFilename(fallback);

  downloadBlob(blob, filename);
}

async function readFallbackPage(pageId: number) {
  try {
    return await getPage(pageId);
  } catch {
    return undefined;
  }
}

async function readExportError(response: Response) {
  try {
    const payload = (await response.json()) as { message?: string; error?: string };
    return payload.message ?? payload.error ?? `Export failed with status ${response.status}`;
  } catch {
    return `Export failed with status ${response.status}`;
  }
}

function getFilenameFromContentDisposition(header: string | null) {
  if (!header) {
    return null;
  }

  const encodedFilename = header.match(/filename\*=([^;]+)/i)?.[1];

  if (encodedFilename) {
    const value = stripHeaderQuotes(encodedFilename.trim());
    const filename = value.includes("''") ? value.split("''").slice(1).join("''") : value;

    try {
      return decodeURIComponent(filename);
    } catch {
      return filename;
    }
  }

  const quotedFilename = header.match(/filename="([^"]+)"/i)?.[1];

  if (quotedFilename) {
    return quotedFilename;
  }

  return header.match(/filename=([^;]+)/i)?.[1]?.trim() ?? null;
}

function getFallbackFilename(page?: ExportPageFallback) {
  const extension = page?.type === "COLLECTION" ? "zip" : "md";
  const fallbackTitle = page?.type === "COLLECTION" ? "Untitled collection" : "Untitled";
  const title = sanitizeFilename(page?.title.trim() || fallbackTitle);

  return `${title}.${extension}`;
}

function sanitizeFilename(filename: string) {
  return filename.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_").slice(0, 120) || "Untitled";
}

function stripHeaderQuotes(value: string) {
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1);
  }

  return value;
}

function downloadBlob(blob: Blob, filename: string) {
  const objectUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.style.display = "none";

  document.body.append(anchor);
  anchor.click();
  anchor.remove();

  window.URL.revokeObjectURL(objectUrl);
}
