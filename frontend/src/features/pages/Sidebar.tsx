import {
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
  Moon,
  Pencil,
  Plus,
  Sun,
  Trash2
} from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { PageDto } from "../../shared/types/page";
import { useTheme } from "../../shared/ui/ThemeProvider";

type SidebarProps = {
  pages: PageDto[];
  childrenByCollectionId: Record<number, PageDto[]>;
  expandedCollectionIds: number[];
  loadingCollectionIds: number[];
  childrenErrorByCollectionId: Record<number, string>;
  selectedPageId: number | null;
  isLoading: boolean;
  errorMessage: string | null;
  isCreatingPage: boolean;
  creatingChildCollectionId: number | null;
  savingPageId: number | null;
  deletingPageId: number | null;
  exitingPageIds: number[];
  onCreateRootNote: () => void;
  onCreateRootCollection: () => void;
  onCreateNoteInCollection: (collectionId: number) => void;
  onDeletePage: (pageId: number) => void;
  onRenameCollection: (collectionId: number, title: string) => Promise<void>;
  onSelectPage: (pageId: number) => void;
  onToggleCollection: (collectionId: number) => void;
};

type SidebarDepthStyle = CSSProperties & {
  "--sidebar-depth-offset": string;
};

export function Sidebar({
  pages,
  childrenByCollectionId,
  expandedCollectionIds,
  loadingCollectionIds,
  childrenErrorByCollectionId,
  selectedPageId,
  isLoading,
  errorMessage,
  isCreatingPage,
  creatingChildCollectionId,
  savingPageId,
  deletingPageId,
  exitingPageIds,
  onCreateRootNote,
  onCreateRootCollection,
  onCreateNoteInCollection,
  onDeletePage,
  onRenameCollection,
  onSelectPage,
  onToggleCollection
}: SidebarProps) {
  const { theme, toggleTheme } = useTheme();
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [editingCollectionId, setEditingCollectionId] = useState<number | null>(null);
  const [collectionTitleDraft, setCollectionTitleDraft] = useState("");
  const createMenuRef = useRef<HTMLDivElement | null>(null);
  const collectionTitleInputRef = useRef<HTMLInputElement | null>(null);
  const isCommittingCollectionRenameRef = useRef(false);

  useEffect(() => {
    if (!isCreateMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (target instanceof Node && createMenuRef.current?.contains(target)) {
        return;
      }

      setIsCreateMenuOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isCreateMenuOpen]);

  useEffect(() => {
    if (editingCollectionId === null) {
      return;
    }

    collectionTitleInputRef.current?.focus();
    collectionTitleInputRef.current?.select();
  }, [editingCollectionId]);

  function createRootNote() {
    setIsCreateMenuOpen(false);
    onCreateRootNote();
  }

  function createRootCollection() {
    setIsCreateMenuOpen(false);
    onCreateRootCollection();
  }

  function startCollectionRename(page: PageDto) {
    if (
      deletingPageId === page.id ||
      exitingPageIds.includes(page.id) ||
      savingPageId === page.id
    ) {
      return;
    }

    setEditingCollectionId(page.id);
    setCollectionTitleDraft(page.title.trim() || "Untitled collection");
  }

  function cancelCollectionRename() {
    setEditingCollectionId(null);
    setCollectionTitleDraft("");
  }

  async function commitCollectionRename(page: PageDto) {
    if (isCommittingCollectionRenameRef.current) {
      return;
    }

    const normalizedTitle = collectionTitleDraft.trim() || "Untitled collection";

    if (normalizedTitle === page.title) {
      cancelCollectionRename();
      return;
    }

    isCommittingCollectionRenameRef.current = true;

    try {
      await onRenameCollection(page.id, normalizedTitle);
      cancelCollectionRename();
    } catch {
      collectionTitleInputRef.current?.focus();
    } finally {
      isCommittingCollectionRenameRef.current = false;
    }
  }

  function renderPage(page: PageDto, depth: number) {
    if (page.type === "COLLECTION") {
      return renderCollection(page, depth);
    }

    return renderNote(page, depth);
  }

  function renderNote(page: PageDto, depth: number) {
    const isExiting = exitingPageIds.includes(page.id);

    return (
      <div
        key={page.id}
        className={`sidebar__item ${selectedPageId === page.id ? "is-active" : ""} ${
          isExiting ? "is-exiting" : ""
        }`}
        style={getDepthStyle(depth)}
      >
        <button
          type="button"
          className="sidebar__item-button"
          disabled={isExiting}
          onClick={() => onSelectPage(page.id)}
        >
          <FileText size={14} />
          <span>{page.title.trim() || "Untitled"}</span>
        </button>
        <button
          type="button"
          className="sidebar__item-delete"
          aria-label={`Delete ${page.title.trim() || "Untitled"}`}
          disabled={deletingPageId === page.id || isExiting}
          onClick={() => onDeletePage(page.id)}
        >
          <Trash2 size={13} />
        </button>
      </div>
    );
  }

  function renderCollection(page: PageDto, depth: number) {
    const isExpanded = expandedCollectionIds.includes(page.id);
    const isLoadingChildren = loadingCollectionIds.includes(page.id);
    const childError = childrenErrorByCollectionId[page.id];
    const children = childrenByCollectionId[page.id] ?? [];
    const hasLoadedChildren = childrenByCollectionId[page.id] !== undefined;
    const isExiting = exitingPageIds.includes(page.id);
    const isEditingTitle = editingCollectionId === page.id;
    const isRenaming = savingPageId === page.id;

    return (
      <div key={page.id} className="sidebar__collection">
        <div
          className={`sidebar__item sidebar__item--collection ${isExiting ? "is-exiting" : ""}`}
          style={getDepthStyle(depth)}
        >
          {isEditingTitle ? (
            <div className="sidebar__collection-edit">
              <span className={`sidebar__chevron ${isExpanded ? "is-expanded" : ""}`}>
                <ChevronRight size={13} />
              </span>
              {isExpanded ? <FolderOpen size={14} /> : <Folder size={14} />}
              <input
                ref={collectionTitleInputRef}
                className="sidebar__rename-input"
                value={collectionTitleDraft}
                disabled={isRenaming}
                aria-label="Collection title"
                onChange={(event) => setCollectionTitleDraft(event.target.value)}
                onBlur={() => void commitCollectionRename(page)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void commitCollectionRename(page);
                    return;
                  }

                  if (event.key === "Escape") {
                    event.preventDefault();
                    cancelCollectionRename();
                  }
                }}
              />
            </div>
          ) : (
            <button
              type="button"
              className="sidebar__item-button sidebar__item-button--collection"
              aria-expanded={isExpanded}
              disabled={isExiting}
              onClick={() => onToggleCollection(page.id)}
            >
              <span className={`sidebar__chevron ${isExpanded ? "is-expanded" : ""}`}>
                <ChevronRight size={13} />
              </span>
              {isExpanded ? <FolderOpen size={14} /> : <Folder size={14} />}
              <span>{page.title.trim() || "Untitled collection"}</span>
            </button>
          )}
          {!isEditingTitle ? (
            <button
              type="button"
              className="sidebar__item-rename"
              aria-label={`Rename ${page.title.trim() || "Untitled collection"}`}
              title="Rename collection"
              disabled={isRenaming || deletingPageId === page.id || isExiting}
              onClick={() => startCollectionRename(page)}
            >
              <Pencil size={13} />
            </button>
          ) : null}
          {!isEditingTitle ? (
            <button
              type="button"
              className="sidebar__item-delete"
              aria-label={`Delete ${page.title.trim() || "Untitled collection"}`}
              disabled={isRenaming || deletingPageId === page.id || isExiting}
              onClick={() => onDeletePage(page.id)}
            >
              <Trash2 size={13} />
            </button>
          ) : null}
        </div>

        {isExpanded ? (
          <div className="sidebar__children">
            {isLoadingChildren ? (
              <div
                className="sidebar__state sidebar__state--muted sidebar__state--nested"
                style={getDepthStyle(depth + 1)}
              >
                Loading...
              </div>
            ) : null}
            {!isLoadingChildren && childError ? (
              <div
                className="sidebar__state sidebar__state--error sidebar__state--nested"
                style={getDepthStyle(depth + 1)}
              >
                {childError}
              </div>
            ) : null}
            {!isLoadingChildren && !childError && hasLoadedChildren
              ? children.map((child) => renderPage(child, depth + 1))
              : null}
            {!isLoadingChildren && !childError && hasLoadedChildren ? (
              <button
                type="button"
                className="sidebar__create-note"
                style={getDepthStyle(depth + 1)}
                disabled={creatingChildCollectionId === page.id}
                onClick={() => onCreateNoteInCollection(page.id)}
              >
                <Plus size={13} />
                <span>
                  {creatingChildCollectionId === page.id ? "Creating..." : "Create note"}
                </span>
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <aside className="sidebar">
      <div className="sidebar__top">
        <div className="sidebar__brand">
          <span className="sidebar__brand-mark">N</span>
          <div>
            <div className="sidebar__brand-title">Nexis</div>
            <div className="sidebar__brand-caption">Workspace</div>
          </div>
        </div>
        <button type="button" className="theme-switch" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>

      <div ref={createMenuRef} className="sidebar__create">
        <button
          type="button"
          className="sidebar__create-button"
          aria-label="Create"
          aria-expanded={isCreateMenuOpen}
          disabled={isCreatingPage}
          onClick={() => setIsCreateMenuOpen((current) => !current)}
        >
          <Plus size={15} />
        </button>

        {isCreateMenuOpen ? (
          <div className="sidebar__create-menu" role="menu" aria-label="Create page">
            <button type="button" role="menuitem" disabled={isCreatingPage} onClick={createRootNote}>
              <FileText size={14} />
              <span>Create note</span>
            </button>
            <button
              type="button"
              role="menuitem"
              disabled={isCreatingPage}
              onClick={createRootCollection}
            >
              <Folder size={14} />
              <span>Create collection</span>
            </button>
          </div>
        ) : null}
      </div>

      <div className="sidebar__label">Pages</div>

      <div className="sidebar__list">
        {isLoading ? <div className="sidebar__state sidebar__state--muted">Loading pages...</div> : null}
        {!isLoading && errorMessage ? <div className="sidebar__state sidebar__state--error">{errorMessage}</div> : null}
        {!isLoading && !errorMessage && pages.length === 0 ? (
          <div className="sidebar__state sidebar__state--empty">
            <div>No pages yet</div>
            <span>Create the first note or collection to start writing.</span>
          </div>
        ) : null}
        {!isLoading && pages.map((page) => renderPage(page, 0))}
      </div>

      <div className="sidebar__footer">depedence 2026</div>
    </aside>
  );
}

function getDepthStyle(depth: number): SidebarDepthStyle {
  return {
    "--sidebar-depth-offset": `${depth * 14}px`
  };
}
