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
import { Check, ChevronRight, Edit3, Plus } from "lucide-react";
import remarkGfm from "remark-gfm";
import type { PageDto } from "../../shared/types/page";
import { useToast } from "../../shared/ui/ToastProvider";

export type PageWorkspaceHandle = {
  runWithUnsavedChangesGuard: (action: () => void) => void;
};

type PageWorkspaceProps = {
  page: PageDto | null;
  pagesLoading: boolean;
  savingPageId: number | null;
  topbarContent?: ReactNode;
  onCreatePage: () => void;
  onSavePage: (pageId: number, payload: { title: string; content: string }) => Promise<void>;
};

type PendingAction = (() => void) | null;
type ConfirmDialog = { action: PendingAction } | null;

export const PageWorkspace = forwardRef<PageWorkspaceHandle, PageWorkspaceProps>(
  function PageWorkspace(
    { page, pagesLoading, savingPageId, topbarContent, onCreatePage, onSavePage },
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

    useImperativeHandle(
      ref,
      () => ({
        runWithUnsavedChangesGuard(action) {
          if (isEditingContent && isDraftDirty) {
            setConfirmDialog({ action });
            return;
          }

          action();
        }
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

    if (pagesLoading && !page) {
      return (
        <main className="main main--empty">
          <div className="empty-state">
            <p>Loading pages...</p>
          </div>
        </main>
      );
    }

    if (!page) {
      return (
        <main className="main main--empty">
          <div className="empty-state">
            <p>Select or create a note</p>
            <button type="button" className="ghost-button" onClick={onCreatePage}>
              <Plus size={14} />
              Create note
            </button>
          </div>
        </main>
      );
    }

    return (
      <main className="main">
        <div key={page.id} className="workspace">
          <div className="workspace__topbar">
            <div className="breadcrumb">
              <span>Nexis</span>
              <ChevronRight size={12} />
              <span>{page.title.trim() || "Untitled"}</span>
            </div>
            <div className="workspace__topbar-center">{topbarContent}</div>
            <div className="workspace__actions">
              <div className="workspace__status">{isSaving ? "Saving..." : ""}</div>
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
