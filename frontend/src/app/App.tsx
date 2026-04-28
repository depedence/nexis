import { useEffect, useRef, useState } from "react";
import { PageWorkspace, type PageWorkspaceHandle } from "../features/pages/PageWorkspace";
import { Sidebar } from "../features/pages/Sidebar";
import { createPage, deletePage, getPages, updatePage } from "../features/pages/pagesApi";
import { ApiError } from "../shared/api/apiClient";
import type { PageDto } from "../shared/types/page";
import { useToast } from "../shared/ui/ToastProvider";

export function App() {
  const { showToast } = useToast();
  const [pages, setPages] = useState<PageDto[]>([]);
  const [pagesLoading, setPagesLoading] = useState(true);
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null);
  const [pagesError, setPagesError] = useState<string | null>(null);
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const [savingPageId, setSavingPageId] = useState<number | null>(null);
  const [deletingPageId, setDeletingPageId] = useState<number | null>(null);
  const [exitingPageIds, setExitingPageIds] = useState<number[]>([]);
  const selectedPageRef = useRef<number | null>(null);
  const workspaceRef = useRef<PageWorkspaceHandle | null>(null);
  const isCreatingPageRef = useRef(false);

  const selectedPage = pages.find((page) => page.id === selectedPageId) ?? null;

  useEffect(() => {
    const controller = new AbortController();
    void loadPages(controller.signal);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    selectedPageRef.current = selectedPageId;

    if (selectedPageId === null) {
      window.localStorage.removeItem(SELECTED_PAGE_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(SELECTED_PAGE_STORAGE_KEY, String(selectedPageId));
  }, [selectedPageId]);

  async function loadPages(signal?: AbortSignal) {
    setPagesLoading(true);
    setPagesError(null);

    try {
      const nextPages = sortPages(await getPages(signal));
      setPages(nextPages);
      setSelectedPageId((current) => {
        const preferredId = current ?? getStoredSelectedPageId();

        if (preferredId !== null && nextPages.some((page) => page.id === preferredId)) {
          return preferredId;
        }

        return nextPages[0]?.id ?? null;
      });
    } catch (error) {
      if (!signal?.aborted) {
        setPagesError(getErrorMessage(error, "Failed to load pages"));
        showToast({
          title: "Pages error",
          description: getErrorMessage(error, "Failed to load pages"),
          variant: "error"
        });
      }
    } finally {
      setPagesLoading(false);
    }
  }

  async function handleCreatePage() {
    if (isCreatingPageRef.current || isCreatingPage) {
      return;
    }

    isCreatingPageRef.current = true;
    setIsCreatingPage(true);

    try {
      const page = await createPage({
        parentId: null,
        title: "Untitled",
        content: "",
        position: pages.length
      });

      setPages((current) => sortPages([...current, page]));
      setSelectedPageId(page.id);
      showToast({
        title: "Page created",
        description: "New page is ready.",
        variant: "success"
      });
    } catch (error) {
      showToast({
        title: "Create failed",
        description: getErrorMessage(error, "Failed to create page"),
        variant: "error"
      });
    } finally {
      isCreatingPageRef.current = false;
      setIsCreatingPage(false);
    }
  }

  async function handleDeletePage(pageId: number) {
    if (deletingPageId === pageId || exitingPageIds.includes(pageId)) {
      return;
    }

    const pageIndex = pages.findIndex((page) => page.id === pageId);
    const nextSelectedPageId = getNextSelectedPageId(pages, pageId, pageIndex);

    setDeletingPageId(pageId);

    try {
      await deletePage(pageId);
      setExitingPageIds((current) => [...current, pageId]);

      if (selectedPageRef.current === pageId) {
        setSelectedPageId(nextSelectedPageId);
      }

      window.setTimeout(() => {
        setPages((current) => current.filter((page) => page.id !== pageId));
        setExitingPageIds((current) => current.filter((id) => id !== pageId));
      }, EXIT_ANIMATION_MS);

      showToast({
        title: "Page deleted",
        description: "The page was removed.",
        variant: "success"
      });
    } catch (error) {
      showToast({
        title: "Delete failed",
        description: getErrorMessage(error, "Failed to delete page"),
        variant: "error"
      });
    } finally {
      setDeletingPageId(null);
    }
  }

  async function handleSavePage(pageId: number, payload: { title: string; content: string }) {
    const currentPage = pages.find((page) => page.id === pageId);
    const normalizedTitle = payload.title.trim() || "Untitled";
    const normalizedContent = payload.content;

    if (
      !currentPage ||
      (currentPage.title === normalizedTitle && (currentPage.content ?? "") === normalizedContent)
    ) {
      return;
    }

    setSavingPageId(pageId);

    try {
      const updatedPage = await updatePage(pageId, {
        title: normalizedTitle,
        content: normalizedContent
      });
      setPages((current) =>
        sortPages(current.map((page) => (page.id === pageId ? updatedPage : page)))
      );
    } catch (error) {
      showToast({
        title: "Save failed",
        description: getErrorMessage(error, "Failed to update page"),
        variant: "error"
      });
      throw error;
    } finally {
      setSavingPageId(null);
    }
  }

  function runWithUnsavedChangesGuard(action: () => void) {
    if (workspaceRef.current) {
      workspaceRef.current.runWithUnsavedChangesGuard(action);
      return;
    }

    action();
  }

  return (
    <div className="app-frame">
      <Sidebar
        pages={pages}
        selectedPageId={selectedPageId}
        isLoading={pagesLoading}
        errorMessage={pagesError}
        isCreatingPage={isCreatingPage}
        deletingPageId={deletingPageId}
        exitingPageIds={exitingPageIds}
        onCreatePage={() => runWithUnsavedChangesGuard(() => void handleCreatePage())}
        onDeletePage={(pageId) => runWithUnsavedChangesGuard(() => void handleDeletePage(pageId))}
        onSelectPage={(pageId) => {
          if (pageId === selectedPageId) {
            return;
          }

          runWithUnsavedChangesGuard(() => setSelectedPageId(pageId));
        }}
      />
      <PageWorkspace
        ref={workspaceRef}
        page={selectedPage}
        pagesLoading={pagesLoading}
        savingPageId={savingPageId}
        onCreatePage={() => runWithUnsavedChangesGuard(() => void handleCreatePage())}
        onSavePage={handleSavePage}
      />
    </div>
  );
}

const SELECTED_PAGE_STORAGE_KEY = "nexis-selected-page-id";
const EXIT_ANIMATION_MS = 180;

function sortPages(pages: PageDto[]) {
  return [...pages].sort((left, right) => left.position - right.position || left.id - right.id);
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function getStoredSelectedPageId() {
  const rawValue = window.localStorage.getItem(SELECTED_PAGE_STORAGE_KEY);
  const parsedValue = rawValue ? Number(rawValue) : Number.NaN;

  return Number.isInteger(parsedValue) ? parsedValue : null;
}

function getNextSelectedPageId(pages: PageDto[], pageId: number, pageIndex: number) {
  if (pageIndex === -1) {
    return pages[0]?.id ?? null;
  }

  const remainingPages = pages.filter((page) => page.id !== pageId);

  if (remainingPages.length === 0) {
    return null;
  }

  return remainingPages[pageIndex]?.id ?? remainingPages[pageIndex - 1]?.id ?? remainingPages[0]?.id ?? null;
}
