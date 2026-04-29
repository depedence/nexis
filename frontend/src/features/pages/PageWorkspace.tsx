import {
  forwardRef,
  type ReactNode,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from "react";
import ReactMarkdown from "react-markdown";
import { Check, ChevronRight, Edit3, FileDown, FileText, Plus, Star } from "lucide-react";
import remarkGfm from "remark-gfm";
import type { PageDto } from "../../shared/types/page";
import { useToast } from "../../shared/ui/ToastProvider";

export type PageWorkspaceHandle = {
  runWithUnsavedChangesGuard: (action: () => void) => void;
};

type PageWorkspaceProps = {
  page: PageDto | null;
  favoritePages: PageDto[];
  recentPages: PageDto[];
  pagesLoading: boolean;
  favoritePagesLoading: boolean;
  recentPagesLoading: boolean;
  recentPagesError: string | null;
  savingPageId: number | null;
  favoritingPageId: number | null;
  exportingPageId: number | null;
  topbarContent?: ReactNode;
  onCreatePage: () => void;
  onOpenHome: () => void;
  onOpenPage: (pageId: number) => void;
  onExportPage: (page: PageDto) => void;
  onToggleFavorite: (page: PageDto) => void;
  onSavePage: (pageId: number, payload: { title: string; content: string }) => Promise<void>;
};

type PendingAction = (() => void) | null;
type ConfirmDialog = { action: PendingAction } | null;

export const PageWorkspace = forwardRef<PageWorkspaceHandle, PageWorkspaceProps>(
  function PageWorkspace(
    {
      page,
      favoritePages,
      recentPages,
      pagesLoading,
      favoritePagesLoading,
      recentPagesLoading,
      recentPagesError,
      savingPageId,
      favoritingPageId,
      exportingPageId,
      topbarContent,
      onCreatePage,
      onOpenHome,
      onOpenPage,
      onExportPage,
      onToggleFavorite,
      onSavePage
    },
    ref
  ) {
    const { showToast } = useToast();
    const [titleDraft, setTitleDraft] = useState(page?.title ?? "");
    const [contentDraft, setContentDraft] = useState(page?.content ?? "");
    const [isEditingContent, setIsEditingContent] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>(null);
    const titleRef = useRef<HTMLTextAreaElement | null>(null);
    const contentRef = useRef<HTMLTextAreaElement | null>(null);
    const isSavingRef = useRef(false);
    const lastSyncedRef = useRef({
      pageId: page?.id ?? null,
      title: page?.title ?? "",
      content: page?.content ?? ""
    });

    const isSaving = page ? savingPageId === page.id || isSavingRef.current : false;
    const isFavoriting = page ? favoritingPageId === page.id : false;
    const isExporting = page ? exportingPageId === page.id : false;
    const isContentDirty =
      Boolean(page) &&
      lastSyncedRef.current.pageId === page?.id &&
      lastSyncedRef.current.content !== contentDraft;
    const isDraftDirty =
      isContentDirty ||
      (Boolean(page) &&
        lastSyncedRef.current.pageId === page?.id &&
        lastSyncedRef.current.title !== (titleDraft.trim() || "Untitled"));
    const previewContent = useMemo(() => contentDraft.trim(), [contentDraft]);

    function runWithUnsavedChangesGuard(action: () => void) {
      if (isEditingContent && isDraftDirty) {
        setConfirmDialog({ action });
        return;
      }

      action();
    }

    useImperativeHandle(
      ref,
      () => ({
        runWithUnsavedChangesGuard
      }),
      [isDraftDirty, isEditingContent]
    );

    useEffect(() => {
      setTitleDraft(page?.title ?? "");
      setContentDraft(page?.content ?? "");
      setIsEditingContent(false);
      setConfirmDialog(null);
      lastSyncedRef.current = {
        pageId: page?.id ?? null,
        title: page?.title ?? "",
        content: page?.content ?? ""
      };
    }, [page?.id, page?.title, page?.content]);

    useEffect(() => {
      const node = titleRef.current;

      if (!node) {
        return;
      }

      node.style.height = "0px";
      node.style.height = `${node.scrollHeight}px`;
    }, [titleDraft]);

    useEffect(() => {
      const node = contentRef.current;

      if (!node || !isEditingContent) {
        return;
      }

      node.style.height = "0px";
      node.style.height = `${Math.max(node.scrollHeight, 320)}px`;
    }, [contentDraft, isEditingContent]);

    useEffect(() => {
      if (!isEditingContent) {
        return;
      }

      contentRef.current?.focus();
    }, [isEditingContent]);

    useEffect(() => {
      if (!isEditingContent || !isDraftDirty) {
        return;
      }

      const handleBeforeUnload = (event: BeforeUnloadEvent) => {
        event.preventDefault();
        event.returnValue = "";
      };

      window.addEventListener("beforeunload", handleBeforeUnload);
      return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isDraftDirty, isEditingContent]);

    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key !== "Escape" || !isEditingContent) {
          return;
        }

        event.preventDefault();

        if (isDraftDirty) {
          setConfirmDialog({ action: null });
          return;
        }

        discardContentChanges();
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isDraftDirty, isEditingContent]);

    async function flushTitleSave() {
      if (!page || isEditingContent) {
        return;
      }

      const normalizedTitle = titleDraft.trim() || "Untitled";

      if (normalizedTitle === lastSyncedRef.current.title) {
        return;
      }

      await onSavePage(page.id, { title: titleDraft, content: lastSyncedRef.current.content });
      lastSyncedRef.current = {
        pageId: page.id,
        title: normalizedTitle,
        content: lastSyncedRef.current.content
      };
    }

    async function saveContentChanges(afterSave?: PendingAction) {
      if (!page || isSavingRef.current) {
        return;
      }

      isSavingRef.current = true;

      try {
        await onSavePage(page.id, { title: titleDraft, content: contentDraft });
        lastSyncedRef.current = {
          pageId: page.id,
          title: titleDraft.trim() || "Untitled",
          content: contentDraft
        };
        setIsEditingContent(false);
        setConfirmDialog(null);
        showToast({
          title: "Page saved",
          description: "Markdown content is up to date.",
          variant: "success"
        });
        afterSave?.();
      } finally {
        isSavingRef.current = false;
      }
    }

    function discardContentChanges(afterDiscard?: PendingAction) {
      setTitleDraft(lastSyncedRef.current.title);
      setContentDraft(lastSyncedRef.current.content);
      setIsEditingContent(false);
      setConfirmDialog(null);
      afterDiscard?.();
    }

    function handleEditButtonClick() {
      if (!page || isSaving) {
        return;
      }

      if (!isEditingContent) {
        setIsEditingContent(true);
        return;
      }

      void saveContentChanges();
    }

    function handleExportButtonClick() {
      if (!page || isSaving || isExporting) {
        return;
      }

      onExportPage({
        ...page,
        title: titleDraft.trim() || "Untitled"
      });
    }

    function handleFavoriteButtonClick() {
      if (!page || isFavoriting) {
        return;
      }

      onToggleFavorite(page);
    }

    function handleHomeButtonClick() {
      runWithUnsavedChangesGuard(onOpenHome);
    }

    if (!page) {
      return (
        <main className="main">
          <div className="workspace workspace--home">
            <div className="workspace__topbar">
              <div className="breadcrumb">
                <span className="breadcrumb__current">Nexis</span>
              </div>
              <div className="workspace__topbar-center">{topbarContent}</div>
              <div className="workspace__actions">
                <button
                  type="button"
                  className="workspace__icon-button"
                  aria-label="Create note"
                  title="Create note"
                  onClick={onCreatePage}
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>

            <section className="home-shell" aria-label="Home">
              <HomeSection
                title="Favorite Pages"
                pages={favoritePages}
                isLoading={favoritePagesLoading}
                emptyMessage="No favorite pages yet"
                loadingMessage="Loading favorite pages..."
                onOpenPage={onOpenPage}
              />
              <HomeSection
                title="Recent Pages"
                pages={recentPages}
                isLoading={recentPagesLoading || pagesLoading}
                emptyMessage="No recent pages"
                errorMessage={recentPagesError}
                loadingMessage="Loading recent pages..."
                showUpdatedAt
                onOpenPage={onOpenPage}
              />
            </section>
          </div>
        </main>
      );
    }

    return (
      <main className="main">
        <div key={page.id} className="workspace">
          <div className="workspace__topbar">
            <div className="breadcrumb">
              <button type="button" className="breadcrumb__home" onClick={handleHomeButtonClick}>
                Nexis
              </button>
              <ChevronRight size={12} />
              <span>{page.title.trim() || "Untitled"}</span>
            </div>
            <div className="workspace__topbar-center">{topbarContent}</div>
            <div className="workspace__actions">
              <div className="workspace__status">{isSaving ? "Saving..." : ""}</div>
              <button
                type="button"
                className={`workspace__icon-button workspace__favorite-button ${
                  page.favorite ? "is-favorite" : ""
                }`}
                aria-label={page.favorite ? "Remove from favorites" : "Add to favorites"}
                title={page.favorite ? "Remove from favorites" : "Add to favorites"}
                disabled={isFavoriting}
                onMouseDown={(event) => event.preventDefault()}
                onClick={handleFavoriteButtonClick}
              >
                <Star size={15} fill={page.favorite ? "currentColor" : "none"} />
              </button>
              {!isEditingContent ? (
                <button
                  type="button"
                  className="workspace__icon-button"
                  aria-label="Export markdown"
                  disabled={isSaving || isExporting}
                  onClick={handleExportButtonClick}
                >
                  <FileDown size={15} />
                </button>
              ) : null}
              <button
                type="button"
                className="workspace__icon-button"
                aria-label={isEditingContent ? "Save page content" : "Edit page content"}
                disabled={isSaving}
                onClick={handleEditButtonClick}
              >
                {isEditingContent ? <Check size={15} /> : <Edit3 size={15} />}
              </button>
            </div>
          </div>

          <section className="page-shell">
            <textarea
              ref={titleRef}
              className="page-title"
              rows={1}
              value={titleDraft}
              placeholder="Untitled"
              onChange={(event) => setTitleDraft(event.target.value)}
              onBlur={() => void flushTitleSave()}
            />

            {isEditingContent ? (
              <textarea
                ref={contentRef}
                className="page-content-editor"
                rows={12}
                value={contentDraft}
                placeholder="Write in Markdown..."
                disabled={isSaving}
                onChange={(event) => setContentDraft(event.target.value)}
              />
            ) : previewContent ? (
              <div className="markdown-preview">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ children, ...props }) => (
                      <a {...props} target="_blank" rel="noreferrer">
                        {children}
                      </a>
                    )
                  }}
                >
                  {contentDraft}
                </ReactMarkdown>
              </div>
            ) : (
              <button
                type="button"
                className="markdown-empty"
                onClick={() => setIsEditingContent(true)}
              >
                Start writing...
              </button>
            )}
          </section>
        </div>

        {confirmDialog ? (
          <div
            className="confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="unsaved-title"
          >
            <div className="confirm-modal__panel">
              <h2 id="unsaved-title">Unsaved changes</h2>
              <p>Cancel editing or save changes before continuing.</p>
              <div className="confirm-modal__actions">
                <button
                  type="button"
                  className="ghost-button ghost-button--inline"
                  onClick={() => discardContentChanges(confirmDialog.action)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="ghost-button ghost-button--inline"
                  disabled={isSaving}
                  onClick={() => void saveContentChanges(confirmDialog.action)}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    );
  }
);

type HomeSectionProps = {
  title: string;
  pages: PageDto[];
  isLoading: boolean;
  emptyMessage: string;
  loadingMessage: string;
  errorMessage?: string | null;
  showUpdatedAt?: boolean;
  onOpenPage: (pageId: number) => void;
};

function HomeSection({
  title,
  pages,
  isLoading,
  emptyMessage,
  loadingMessage,
  errorMessage = null,
  showUpdatedAt = false,
  onOpenPage
}: HomeSectionProps) {
  return (
    <section className="home-section">
      <h2>{title}</h2>
      {isLoading ? <div className="home-section__state">{loadingMessage}</div> : null}
      {!isLoading && errorMessage ? (
        <div className="home-section__state home-section__state--error">{errorMessage}</div>
      ) : null}
      {!isLoading && !errorMessage && pages.length === 0 ? (
        <div className="home-section__state">{emptyMessage}</div>
      ) : null}
      {!isLoading && !errorMessage && pages.length > 0 ? (
        <div className="home-page-list">
          {pages.map((page) => (
            <button
              key={page.id}
              type="button"
              className="home-page-card"
              onClick={() => onOpenPage(page.id)}
            >
              <span className="home-page-card__icon" aria-hidden="true">
                <FileText size={15} />
              </span>
              <span className="home-page-card__body">
                <span className="home-page-card__title">{page.title.trim() || "Untitled"}</span>
                <span className="home-page-card__preview">{getPagePreview(page)}</span>
              </span>
              {showUpdatedAt ? (
                <time className="home-page-card__date" dateTime={page.updatedAt}>
                  {formatUpdatedAt(page.updatedAt)}
                </time>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function getPagePreview(page: PageDto) {
  const preview = stripMarkdown(page.content ?? "");

  if (!preview) {
    return "Empty page";
  }

  return preview.length > 170 ? `${preview.slice(0, 167).trimEnd()}...` : preview;
}

function stripMarkdown(content: string) {
  return content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/[*_~>#-]+/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatUpdatedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
