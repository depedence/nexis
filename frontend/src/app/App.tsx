import { useEffect, useRef, useState } from "react";
import { PageWorkspace, type PageWorkspaceHandle } from "../features/pages/PageWorkspace";
import { SearchCommandPalette } from "../features/pages/SearchCommandPalette";
import { Sidebar } from "../features/pages/Sidebar";
import {
  createPage,
  deletePage,
  exportPage,
  getPage,
  getPageChildren,
  getRootPages,
  updatePage
} from "../features/pages/pagesApi";
import { ApiError } from "../shared/api/apiClient";
import type { PageDto, PageType } from "../shared/types/page";
import { useToast } from "../shared/ui/ToastProvider";

type ChildrenByCollectionId = Record<number, PageDto[]>;
type PageById = Record<number, PageDto>;

export function App() {
  const { showToast } = useToast();
  const [rootPages, setRootPages] = useState<PageDto[]>([]);
  const [childrenByCollectionId, setChildrenByCollectionId] =
    useState<ChildrenByCollectionId>({});
  const [pageById, setPageById] = useState<PageById>({});
  const [pagesLoading, setPagesLoading] = useState(true);
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null);
  const [pagesError, setPagesError] = useState<string | null>(null);
  const [expandedCollectionIds, setExpandedCollectionIds] = useState<number[]>([]);
  const [loadingCollectionIds, setLoadingCollectionIds] = useState<number[]>([]);
  const [childrenErrorByCollectionId, setChildrenErrorByCollectionId] = useState<
    Record<number, string>
  >({});
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const [creatingChildCollectionId, setCreatingChildCollectionId] = useState<number | null>(null);
  const [savingPageId, setSavingPageId] = useState<number | null>(null);
  const [deletingPageId, setDeletingPageId] = useState<number | null>(null);
  const [exportingPageId, setExportingPageId] = useState<number | null>(null);
  const [deleteDialogPageId, setDeleteDialogPageId] = useState<number | null>(null);
  const [isDeleteDialogClosing, setIsDeleteDialogClosing] = useState(false);
  const [exitingPageIds, setExitingPageIds] = useState<number[]>([]);
  const selectedPageRef = useRef<number | null>(null);
  const workspaceRef = useRef<PageWorkspaceHandle | null>(null);
  const isCreatingPageRef = useRef(false);

  const selectedPageCandidate =
    selectedPageId === null ? null : pageById[selectedPageId] ?? null;
  const selectedPage = selectedPageCandidate?.type === "NOTE" ? selectedPageCandidate : null;

  useEffect(() => {
    const controller = new AbortController();
    void loadRootPages(controller.signal);
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

  useEffect(() => {
    if (deleteDialogPageId === null) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      closeDeleteDialog();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteDialogPageId, isDeleteDialogClosing]);

  async function loadRootPages(signal?: AbortSignal) {
    setPagesLoading(true);
    setPagesError(null);

    try {
      const nextRootPages = sortPages(await getRootPages(signal));

      if (signal?.aborted) {
        return;
      }

      setRootPages(nextRootPages);
      setPageById((current) => mergePageList(current, nextRootPages));

      const preferredId = selectedPageRef.current ?? getStoredSelectedPageId();

      if (preferredId !== null) {
        const preferredRootPage = nextRootPages.find((page) => page.id === preferredId);

        if (preferredRootPage?.type === "NOTE") {
          setSelectedPageId(preferredRootPage.id);
          return;
        }

        if (!preferredRootPage && (await restoreSelectedNote(preferredId, signal))) {
          return;
        }
      }

      setSelectedPageId(getFirstNoteId(nextRootPages));
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
      if (!signal?.aborted) {
        setPagesLoading(false);
      }
    }
  }

  async function restoreSelectedNote(pageId: number, signal?: AbortSignal) {
    try {
      const page = await getPage(pageId, signal);

      if (signal?.aborted || page.type !== "NOTE") {
        return false;
      }

      mergeLoadedPage(page);

      if (page.parentId !== null) {
        expandCollection(page.parentId);
        void loadCollectionChildren(page.parentId, signal);
      }

      setSelectedPageId(page.id);
      return true;
    } catch {
      return false;
    }
  }

  async function loadCollectionChildren(collectionId: number, signal?: AbortSignal, force = false) {
    if (!force && childrenByCollectionId[collectionId] !== undefined) {
      return;
    }

    setLoadingCollectionIds((current) => addUniqueId(current, collectionId));
    setChildrenErrorByCollectionId((current) => omitRecordKey(current, collectionId));

    try {
      const children = sortPages(await getPageChildren(collectionId, signal));

      if (signal?.aborted) {
        return;
      }

      setChildrenByCollectionId((current) => ({
        ...current,
        [collectionId]: children
      }));
      setPageById((current) => mergePageList(current, children));
    } catch (error) {
      if (!signal?.aborted) {
        const message = getErrorMessage(error, "Failed to load collection");
        setChildrenErrorByCollectionId((current) => ({
          ...current,
          [collectionId]: message
        }));
        showToast({
          title: "Collection error",
          description: message,
          variant: "error"
        });
      }
    } finally {
      if (!signal?.aborted) {
        setLoadingCollectionIds((current) => current.filter((id) => id !== collectionId));
      }
    }
  }

  async function handleCreateRootNote() {
    await handleCreateRootPage("NOTE");
  }

  async function handleCreateRootCollection() {
    await handleCreateRootPage("COLLECTION");
  }

  async function handleCreateRootPage(type: PageType) {
    if (isCreatingPageRef.current || isCreatingPage) {
      return;
    }

    isCreatingPageRef.current = true;
    setIsCreatingPage(true);

    try {
      const page = await createPage({
        parentId: null,
        title: type === "NOTE" ? "Untitled" : "Untitled collection",
        content: type === "NOTE" ? "" : null,
        type,
        position: getNextPosition(rootPages)
      });

      mergeLoadedPage(page);

      if (page.type === "NOTE") {
        setSelectedPageId(page.id);
      } else {
        expandCollection(page.id);
        setChildrenByCollectionId((current) => ({
          ...current,
          [page.id]: current[page.id] ?? []
        }));
      }

      showToast({
        title: page.type === "NOTE" ? "Note created" : "Collection created",
        description:
          page.type === "NOTE" ? "New note is ready." : "New collection is ready.",
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

  async function handleCreateNoteInCollection(collectionId: number) {
    if (creatingChildCollectionId !== null) {
      return;
    }

    setCreatingChildCollectionId(collectionId);

    try {
      const existingChildren = childrenByCollectionId[collectionId] ?? [];
      const page = await createPage({
        parentId: collectionId,
        title: "Untitled",
        content: "",
        type: "NOTE",
        position: getNextPosition(existingChildren)
      });

      expandCollection(collectionId);
      setChildrenByCollectionId((current) => ({
        ...current,
        [collectionId]: sortPages(upsertPage(current[collectionId] ?? [], page))
      }));
      setPageById((current) => mergePageList(current, [page]));
      setSelectedPageId(page.id);
      showToast({
        title: "Note created",
        description: "New note was added to the collection.",
        variant: "success"
      });
    } catch (error) {
      showToast({
        title: "Create failed",
        description: getErrorMessage(error, "Failed to create note"),
        variant: "error"
      });
    } finally {
      setCreatingChildCollectionId(null);
    }
  }

  function handleRequestDeletePage(pageId: number) {
    if (deletingPageId === pageId || exitingPageIds.includes(pageId)) {
      return;
    }

    setDeleteDialogPageId(pageId);
    setIsDeleteDialogClosing(false);
  }

  function closeDeleteDialog() {
    if (deleteDialogPageId === null || isDeleteDialogClosing) {
      return;
    }

    setIsDeleteDialogClosing(true);
    window.setTimeout(() => {
      setDeleteDialogPageId(null);
      setIsDeleteDialogClosing(false);
    }, CONFIRM_MODAL_EXIT_MS);
  }

  function confirmDeletePage() {
    if (deleteDialogPageId === null || isDeleteDialogClosing) {
      return;
    }

    const pageId = deleteDialogPageId;

    setIsDeleteDialogClosing(true);
    window.setTimeout(() => {
      setDeleteDialogPageId(null);
      setIsDeleteDialogClosing(false);
      void handleDeletePage(pageId);
    }, CONFIRM_MODAL_EXIT_MS);
  }

  async function handleDeletePage(pageId: number) {
    if (deletingPageId === pageId || exitingPageIds.includes(pageId)) {
      return;
    }

    const page = pageById[pageId] ?? findPageInTree(rootPages, childrenByCollectionId, pageId);
    const removedPageIds = collectCachedDescendantIds(pageId, pageById);
    removedPageIds.add(pageId);

    const isSelectedPageAffected =
      selectedPageRef.current !== null && removedPageIds.has(selectedPageRef.current);
    const nextSelectedPageId =
      page?.type === "COLLECTION"
        ? null
        : getNextSelectedNoteId(rootPages, childrenByCollectionId, removedPageIds, pageId);

    setDeletingPageId(pageId);

    try {
      await deletePage(pageId);
      setExitingPageIds((current) => addUniqueId(current, pageId));

      if (isSelectedPageAffected) {
        setSelectedPageId(nextSelectedPageId);
      }

      if (page?.type === "COLLECTION") {
        setExpandedCollectionIds((current) => current.filter((id) => !removedPageIds.has(id)));
      }

      window.setTimeout(() => {
        setRootPages((current) => current.filter((page) => !removedPageIds.has(page.id)));
        setChildrenByCollectionId((current) =>
          removePagesFromChildrenMap(current, removedPageIds)
        );
        setPageById((current) => removePagesFromCache(current, removedPageIds));
        setChildrenErrorByCollectionId((current) => omitRecordKeys(current, removedPageIds));
        setLoadingCollectionIds((current) => current.filter((id) => !removedPageIds.has(id)));
        setExitingPageIds((current) => current.filter((id) => id !== pageId));
      }, EXIT_ANIMATION_MS);

      showToast({
        title: page?.type === "COLLECTION" ? "Collection deleted" : "Note deleted",
        description:
          page?.type === "COLLECTION" ? "The collection was removed." : "The note was removed.",
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
    const currentPage = pageById[pageId];
    const normalizedTitle = payload.title.trim() || "Untitled";
    const normalizedContent = payload.content;

    if (
      !currentPage ||
      currentPage.type !== "NOTE" ||
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
      mergeLoadedPage(updatedPage);
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

  async function handleRenameCollection(collectionId: number, title: string) {
    const currentPage =
      pageById[collectionId] ?? findPageInTree(rootPages, childrenByCollectionId, collectionId);
    const normalizedTitle = title.trim() || "Untitled collection";

    if (!currentPage || currentPage.type !== "COLLECTION" || currentPage.title === normalizedTitle) {
      return;
    }

    setSavingPageId(collectionId);

    try {
      const updatedPage = await updatePage(collectionId, {
        title: normalizedTitle,
        content: null
      });
      mergeLoadedPage(updatedPage);
    } catch (error) {
      showToast({
        title: "Rename failed",
        description: getErrorMessage(error, "Failed to rename collection"),
        variant: "error"
      });
      throw error;
    } finally {
      setSavingPageId(null);
    }
  }

  async function handleExportPage(page: PageDto) {
    if (
      exportingPageId !== null ||
      deletingPageId === page.id ||
      exitingPageIds.includes(page.id)
    ) {
      return;
    }

    setExportingPageId(page.id);

    try {
      await exportPage(page.id, page);
      showToast({
        title: page.type === "COLLECTION" ? "Collection exported" : "Note exported",
        description:
          page.type === "COLLECTION" ? "ZIP download is ready." : "Markdown download is ready.",
        variant: "success"
      });
    } catch (error) {
      showToast({
        title: "Export failed",
        description: getErrorMessage(error, "Failed to export page"),
        variant: "error"
      });
    } finally {
      setExportingPageId(null);
    }
  }

  function mergeLoadedPage(page: PageDto) {
    setPageById((current) => mergePageList(current, [page]));

    if (page.parentId === null) {
      setRootPages((current) => sortPages(upsertPage(current, page)));
      return;
    }

    const parentId = page.parentId;

    setChildrenByCollectionId((current) => {
      const currentChildren = current[parentId];

      if (!currentChildren) {
        return current;
      }

      return {
        ...current,
        [parentId]: sortPages(upsertPage(currentChildren, page))
      };
    });
  }

  function handleToggleCollection(collectionId: number) {
    if (expandedCollectionIds.includes(collectionId)) {
      collapseCollection(collectionId);
      return;
    }

    expandCollection(collectionId);

    if (childrenByCollectionId[collectionId] === undefined) {
      void loadCollectionChildren(collectionId);
    }
  }

  function expandCollection(collectionId: number) {
    setExpandedCollectionIds((current) => addUniqueId(current, collectionId));
  }

  function collapseCollection(collectionId: number) {
    setExpandedCollectionIds((current) => current.filter((id) => id !== collectionId));
  }

  function runWithUnsavedChangesGuard(action: () => void) {
    if (workspaceRef.current) {
      workspaceRef.current.runWithUnsavedChangesGuard(action);
      return;
    }

    action();
  }

  function handleOpenSearchResult(page: PageDto) {
    mergeLoadedPage(page);

    if (page.type === "COLLECTION") {
      if (page.parentId !== null) {
        expandCollection(page.parentId);

        if (childrenByCollectionId[page.parentId] === undefined) {
          void loadCollectionChildren(page.parentId);
        }
      }

      handleToggleCollection(page.id);
      return;
    }

    runWithUnsavedChangesGuard(() => {
      if (page.parentId !== null) {
        expandCollection(page.parentId);

        if (childrenByCollectionId[page.parentId] === undefined) {
          void loadCollectionChildren(page.parentId);
        }
      }

      setSelectedPageId(page.id);
    });
  }

  return (
    <div className="app-frame">
      <Sidebar
        pages={rootPages}
        childrenByCollectionId={childrenByCollectionId}
        expandedCollectionIds={expandedCollectionIds}
        loadingCollectionIds={loadingCollectionIds}
        childrenErrorByCollectionId={childrenErrorByCollectionId}
        selectedPageId={selectedPageId}
        isLoading={pagesLoading}
        errorMessage={pagesError}
        isCreatingPage={isCreatingPage}
        creatingChildCollectionId={creatingChildCollectionId}
        savingPageId={savingPageId}
        deletingPageId={deletingPageId}
        exportingPageId={exportingPageId}
        exitingPageIds={exitingPageIds}
        onCreateRootNote={() => runWithUnsavedChangesGuard(() => void handleCreateRootNote())}
        onCreateRootCollection={() => void handleCreateRootCollection()}
        onCreateNoteInCollection={(collectionId) =>
          runWithUnsavedChangesGuard(() => void handleCreateNoteInCollection(collectionId))
        }
        onDeletePage={(pageId) => runWithUnsavedChangesGuard(() => handleRequestDeletePage(pageId))}
        onExportPage={(page) => void handleExportPage(page)}
        onRenameCollection={handleRenameCollection}
        onSelectPage={(pageId) => {
          const page = pageById[pageId];

          if (!page || page.type !== "NOTE" || pageId === selectedPageId) {
            return;
          }

          runWithUnsavedChangesGuard(() => setSelectedPageId(pageId));
        }}
        onToggleCollection={handleToggleCollection}
      />
      <PageWorkspace
        ref={workspaceRef}
        page={selectedPage}
        pagesLoading={pagesLoading}
        savingPageId={savingPageId}
        exportingPageId={exportingPageId}
        topbarContent={<SearchCommandPalette onOpenPage={handleOpenSearchResult} />}
        onCreatePage={() => runWithUnsavedChangesGuard(() => void handleCreateRootNote())}
        onExportPage={(page) => void handleExportPage(page)}
        onSavePage={handleSavePage}
      />
      {deleteDialogPageId !== null ? (
        <div
          className={`confirm-modal ${isDeleteDialogClosing ? "is-leaving" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-confirm-title"
          aria-describedby="delete-confirm-description"
        >
          <div className="confirm-modal__panel">
            <h2 id="delete-confirm-title">Delete item?</h2>
            <p id="delete-confirm-description">
              Are you sure you want to delete this item? This action cannot be undone.
            </p>
            <div className="confirm-modal__actions">
              <button
                type="button"
                className="ghost-button ghost-button--inline"
                onClick={closeDeleteDialog}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ghost-button ghost-button--inline ghost-button--danger"
                disabled={deletingPageId === deleteDialogPageId}
                onClick={confirmDeletePage}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const SELECTED_PAGE_STORAGE_KEY = "nexis-selected-page-id";
const EXIT_ANIMATION_MS = 180;
const CONFIRM_MODAL_EXIT_MS = 160;

function sortPages(pages: PageDto[]) {
  return [...pages].sort((left, right) => left.position - right.position || left.id - right.id);
}

function upsertPage(pages: PageDto[], nextPage: PageDto) {
  if (pages.some((page) => page.id === nextPage.id)) {
    return pages.map((page) => (page.id === nextPage.id ? nextPage : page));
  }

  return [...pages, nextPage];
}

function mergePageList(pageById: PageById, pages: PageDto[]) {
  return pages.reduce<PageById>(
    (nextPageById, page) => ({
      ...nextPageById,
      [page.id]: page
    }),
    pageById
  );
}

function addUniqueId(ids: number[], nextId: number) {
  return ids.includes(nextId) ? ids : [...ids, nextId];
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

function getNextPosition(pages: PageDto[]) {
  if (pages.length === 0) {
    return 0;
  }

  return Math.max(...pages.map((page) => page.position)) + 1;
}

function getFirstNoteId(pages: PageDto[]) {
  return pages.find((page) => page.type === "NOTE")?.id ?? null;
}

function findPageInTree(
  rootPages: PageDto[],
  childrenByCollectionId: ChildrenByCollectionId,
  pageId: number
) {
  return flattenPages(rootPages, childrenByCollectionId).find((page) => page.id === pageId) ?? null;
}

function flattenPages(rootPages: PageDto[], childrenByCollectionId: ChildrenByCollectionId) {
  const flattenedPages: PageDto[] = [];

  function appendPages(pages: PageDto[]) {
    pages.forEach((page) => {
      flattenedPages.push(page);

      if (page.type === "COLLECTION") {
        appendPages(childrenByCollectionId[page.id] ?? []);
      }
    });
  }

  appendPages(rootPages);
  return flattenedPages;
}

function collectCachedDescendantIds(pageId: number, pageById: PageById) {
  const removedPageIds = new Set<number>();
  let didAddPage = true;

  while (didAddPage) {
    didAddPage = false;

    Object.values(pageById).forEach((page) => {
      if (page.parentId !== null && (page.parentId === pageId || removedPageIds.has(page.parentId))) {
        if (!removedPageIds.has(page.id)) {
          removedPageIds.add(page.id);
          didAddPage = true;
        }
      }
    });
  }

  return removedPageIds;
}

function getNextSelectedNoteId(
  rootPages: PageDto[],
  childrenByCollectionId: ChildrenByCollectionId,
  removedPageIds: Set<number>,
  anchorPageId: number
) {
  const visiblePages = flattenPages(rootPages, childrenByCollectionId);
  const anchorIndex = visiblePages.findIndex((page) => page.id === anchorPageId);
  const isCandidate = (page: PageDto) =>
    page.type === "NOTE" && !removedPageIds.has(page.id);

  if (anchorIndex === -1) {
    return visiblePages.find(isCandidate)?.id ?? null;
  }

  const nextPage = visiblePages.slice(anchorIndex + 1).find(isCandidate);

  if (nextPage) {
    return nextPage.id;
  }

  return [...visiblePages.slice(0, anchorIndex)].reverse().find(isCandidate)?.id ?? null;
}

function removePagesFromChildrenMap(
  childrenByCollectionId: ChildrenByCollectionId,
  removedPageIds: Set<number>
) {
  return Object.entries(childrenByCollectionId).reduce<ChildrenByCollectionId>(
    (nextChildrenByCollectionId, [collectionId, children]) => {
      const numericCollectionId = Number(collectionId);

      if (removedPageIds.has(numericCollectionId)) {
        return nextChildrenByCollectionId;
      }

      return {
        ...nextChildrenByCollectionId,
        [numericCollectionId]: children.filter((page) => !removedPageIds.has(page.id))
      };
    },
    {}
  );
}

function removePagesFromCache(pageById: PageById, removedPageIds: Set<number>) {
  return Object.entries(pageById).reduce<PageById>((nextPageById, [pageId, page]) => {
    if (removedPageIds.has(Number(pageId))) {
      return nextPageById;
    }

    return {
      ...nextPageById,
      [page.id]: page
    };
  }, {});
}

function omitRecordKey<T>(record: Record<number, T>, key: number) {
  return omitRecordKeys(record, new Set([key]));
}

function omitRecordKeys<T>(record: Record<number, T>, keys: Set<number>) {
  return Object.entries(record).reduce<Record<number, T>>((nextRecord, [key, value]) => {
    const numericKey = Number(key);

    if (keys.has(numericKey)) {
      return nextRecord;
    }

    return {
      ...nextRecord,
      [numericKey]: value
    };
  }, {});
}
