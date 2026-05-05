import {
  ChevronRight,
  Download,
  FileText,
  Folder,
  FolderOpen,
  MoreHorizontal,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plus,
  LogOut,
  Search,
  Star,
  Sun,
  Trash2,
  Upload
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent
} from "react";
import type { PageDto } from "../../shared/types/page";
import { useAuth } from "../auth/AuthProvider";
import { useTheme } from "../../shared/ui/ThemeProvider";

type SidebarProps = {
  pages: PageDto[];
  favoritePages: PageDto[];
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
  favoritingPageId: number | null;
  deletingPageId: number | null;
  exportingPageId: number | null;
  isImportingMarkdown: boolean;
  isImportingRootMarkdown: boolean;
  importingCollectionId: number | null;
  exitingPageIds: number[];
  onCreateRootNote: () => void;
  onCreateRootCollection: () => void;
  onCreateNoteInCollection: (collectionId: number) => void;
  onImportRootMarkdown: (file: File) => void;
  onImportMarkdownToCollection: (collectionId: number, file: File) => void;
  onDeletePage: (pageId: number) => void;
  onExportPage: (page: PageDto) => void;
  onToggleFavorite: (page: PageDto) => void;
  onRenameCollection: (collectionId: number, title: string) => Promise<void>;
  onOpenHome: () => void;
  onOpenSearch: () => void;
  onSelectPage: (pageId: number) => void;
  onToggleCollection: (collectionId: number) => void;
};

type SidebarStyle = CSSProperties & {
  "--sidebar-current-width": string;
};

type SidebarDepthStyle = CSSProperties & {
  "--sidebar-depth-offset": string;
};

type NoteRenderOptions = {
  scope?: "pages" | "favorites";
  showDelete?: boolean;
};

type FavoriteCollectionGroup = {
  collection: PageDto;
  notes: PageDto[];
};

type FavoriteTree = {
  rootNotes: PageDto[];
  groups: FavoriteCollectionGroup[];
};

const SIDEBAR_WIDTH_STORAGE_KEY = "nexis-sidebar-width";
const SIDEBAR_COLLAPSED_STORAGE_KEY = "nexis-sidebar-collapsed";
const SIDEBAR_COLLAPSED_WIDTH = 64;
const SIDEBAR_EXPANDED_MIN_WIDTH = 220;
const SIDEBAR_DEFAULT_WIDTH = 240;
const SIDEBAR_MAX_WIDTH = 420;
const SIDEBAR_COLLAPSE_THRESHOLD = 142;

export function Sidebar({
  pages,
  favoritePages,
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
  favoritingPageId,
  deletingPageId,
  exportingPageId,
  isImportingMarkdown,
  isImportingRootMarkdown,
  importingCollectionId,
  exitingPageIds,
  onCreateRootNote,
  onCreateRootCollection,
  onCreateNoteInCollection,
  onImportRootMarkdown,
  onImportMarkdownToCollection,
  onDeletePage,
  onExportPage,
  onToggleFavorite,
  onRenameCollection,
  onOpenHome,
  onOpenSearch,
  onSelectPage,
  onToggleCollection
}: SidebarProps) {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarWidth, setSidebarWidth] = useState(() => getStoredSidebarWidth());
  const [isCollapsed, setIsCollapsed] = useState(() => getStoredSidebarCollapsed());
  const [isResizing, setIsResizing] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [openActionMenuKey, setOpenActionMenuKey] = useState<string | null>(null);
  const [expandedFavoriteCollectionIds, setExpandedFavoriteCollectionIds] = useState<number[]>([]);
  const [editingCollectionId, setEditingCollectionId] = useState<number | null>(null);
  const [collectionTitleDraft, setCollectionTitleDraft] = useState("");
  const createMenuRef = useRef<HTMLDivElement | null>(null);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);
  const rootImportInputRef = useRef<HTMLInputElement | null>(null);
  const collectionImportInputRef = useRef<HTMLInputElement | null>(null);
  const collectionImportTargetIdRef = useRef<number | null>(null);
  const collectionTitleInputRef = useRef<HTMLInputElement | null>(null);
  const isCommittingCollectionRenameRef = useRef(false);
  const sidebarRef = useRef<HTMLElement | null>(null);
  const sidebarStyle: SidebarStyle = {
    "--sidebar-current-width": `${isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : sidebarWidth}px`
  };

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(sidebarWidth));
  }, [sidebarWidth]);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(isCollapsed));
  }, [isCollapsed]);

  useEffect(
    () => () => {
      document.body.classList.remove("is-sidebar-resizing");
    },
    []
  );

  useEffect(() => {
    if (!isCollapsed) {
      return;
    }

    setOpenActionMenuKey(null);
    setEditingCollectionId(null);
  }, [isCollapsed]);

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
    if (openActionMenuKey === null) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (target instanceof Node && exportMenuRef.current?.contains(target)) {
        return;
      }

      setOpenActionMenuKey(null);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [openActionMenuKey]);

  useEffect(() => {
    if (openActionMenuKey === null) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      setOpenActionMenuKey(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openActionMenuKey]);

  useEffect(() => {
    if (editingCollectionId === null) {
      return;
    }

    collectionTitleInputRef.current?.focus();
    collectionTitleInputRef.current?.select();
  }, [editingCollectionId]);

  function toggleSidebarCollapsed() {
    setIsCollapsed((current) => !current);
  }

  function handleResizePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const sidebarNode = sidebarRef.current;

    if (!sidebarNode) {
      return;
    }

    event.preventDefault();
    setIsResizing(true);
    document.body.classList.add("is-sidebar-resizing");

    const sidebarLeft = sidebarNode.getBoundingClientRect().left;

    const handlePointerMove = (pointerEvent: PointerEvent) => {
      const nextWidth = pointerEvent.clientX - sidebarLeft;

      if (nextWidth <= SIDEBAR_COLLAPSE_THRESHOLD) {
        setIsCollapsed(true);
        return;
      }

      setIsCollapsed(false);
      setSidebarWidth(clamp(nextWidth, SIDEBAR_EXPANDED_MIN_WIDTH, SIDEBAR_MAX_WIDTH));
    };

    const stopResize = () => {
      setIsResizing(false);
      document.body.classList.remove("is-sidebar-resizing");
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResize);
      window.removeEventListener("pointercancel", stopResize);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResize);
    window.addEventListener("pointercancel", stopResize);
  }

  function createRootNote() {
    setIsCreateMenuOpen(false);
    onCreateRootNote();
  }

  function createRootCollection() {
    setIsCreateMenuOpen(false);
    onCreateRootCollection();
  }

  function openRootImportPicker() {
    if (isImportingMarkdown) {
      return;
    }

    const input = rootImportInputRef.current;

    if (!input) {
      return;
    }

    input.value = "";
    input.click();
  }

  function handleRootImportInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0] ?? null;
    event.currentTarget.value = "";

    if (!file) {
      return;
    }

    onImportRootMarkdown(file);
  }

  function openCollectionImportPicker(event: MouseEvent<HTMLButtonElement>, collectionId: number) {
    event.preventDefault();
    event.stopPropagation();

    if (isImportingMarkdown) {
      return;
    }

    const input = collectionImportInputRef.current;

    if (!input) {
      return;
    }

    setOpenActionMenuKey(null);
    collectionImportTargetIdRef.current = collectionId;
    input.value = "";
    input.click();
  }

  function handleCollectionImportInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0] ?? null;
    const collectionId = collectionImportTargetIdRef.current;

    event.currentTarget.value = "";
    collectionImportTargetIdRef.current = null;

    if (!file || collectionId === null) {
      return;
    }

    onImportMarkdownToCollection(collectionId, file);
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

  function toggleActionMenu(event: MouseEvent<HTMLButtonElement>, menuKey: string) {
    event.preventDefault();
    event.stopPropagation();
    setOpenActionMenuKey((current) => (current === menuKey ? null : menuKey));
  }

  function exportSidebarPage(event: MouseEvent<HTMLButtonElement>, page: PageDto) {
    event.preventDefault();
    event.stopPropagation();
    setOpenActionMenuKey(null);
    onExportPage(page);
  }

  function toggleFavoriteFromMenu(event: MouseEvent<HTMLButtonElement>, page: PageDto) {
    event.preventDefault();
    event.stopPropagation();
    setOpenActionMenuKey(null);
    onToggleFavorite(page);
  }

  function toggleFavoriteCollection(collectionId: number) {
    setExpandedFavoriteCollectionIds((current) =>
      current.includes(collectionId)
        ? current.filter((id) => id !== collectionId)
        : [...current, collectionId]
    );
  }

  function renderPage(page: PageDto, depth: number) {
    if (page.type === "COLLECTION") {
      return renderCollection(page, depth);
    }

    return renderNote(page, depth);
  }

  function renderNote(page: PageDto, depth: number, options: NoteRenderOptions = {}) {
    const isExiting = exitingPageIds.includes(page.id);
    const scope = options.scope ?? "pages";
    const showDelete = options.showDelete ?? true;
    const menuKey = `${scope}:${page.id}`;
    const title = page.title.trim() || "Untitled";

    return (
      <div
        key={menuKey}
        className={`sidebar__item ${selectedPageId === page.id ? "is-active" : ""} ${
          isExiting ? "is-exiting" : ""
        }`}
        style={getDepthStyle(depth)}
      >
        <button
          type="button"
          className="sidebar__item-button"
          disabled={isExiting}
          title={title}
          onClick={() => onSelectPage(page.id)}
        >
          <FileText size={14} />
          <span>{title}</span>
        </button>
        {renderPageActions(page, deletingPageId === page.id || isExiting, menuKey)}
        {showDelete ? (
          <button
            type="button"
            className="sidebar__item-delete"
            aria-label={`Delete ${title}`}
            title="Delete"
            disabled={deletingPageId === page.id || isExiting}
            onClick={() => onDeletePage(page.id)}
          >
            <Trash2 size={13} />
          </button>
        ) : null}
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
    const title = page.title.trim() || "Untitled collection";

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
                title="Rename collection"
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
              title={title}
              onClick={() => onToggleCollection(page.id)}
            >
              <span className={`sidebar__chevron ${isExpanded ? "is-expanded" : ""}`}>
                <ChevronRight size={13} />
              </span>
              {isExpanded ? <FolderOpen size={14} /> : <Folder size={14} />}
              <span>{title}</span>
            </button>
          )}
          {!isEditingTitle ? (
            <button
              type="button"
              className="sidebar__item-rename"
              aria-label={`Rename ${title}`}
              title="Edit"
              disabled={isRenaming || deletingPageId === page.id || isExiting}
              onClick={() => startCollectionRename(page)}
            >
              <Pencil size={13} />
            </button>
          ) : null}
          {!isEditingTitle
            ? renderPageActions(
                page,
                isRenaming || deletingPageId === page.id || isExiting,
                `pages:${page.id}`
              )
            : null}
          {!isEditingTitle ? (
            <button
              type="button"
              className="sidebar__item-delete"
              aria-label={`Delete ${title}`}
              title="Delete"
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
                title="Create note"
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

  function renderFavoritesSection() {
    const favoriteTree = getFavoriteTree(favoritePages, pages, childrenByCollectionId);

    if (favoriteTree.rootNotes.length === 0 && favoriteTree.groups.length === 0) {
      return null;
    }

    return (
      <div className="sidebar__favorites">
        <div className="sidebar__label">Favorites</div>
        <div className="sidebar__list sidebar__list--favorites">
          {favoriteTree.rootNotes.map((page) =>
            renderNote(page, 0, { scope: "favorites", showDelete: false })
          )}
          {favoriteTree.groups.map((group) => renderFavoriteCollectionGroup(group))}
        </div>
      </div>
    );
  }

  function renderFavoriteCollectionGroup(group: FavoriteCollectionGroup) {
    const collection = group.collection;
    const isExpanded = expandedFavoriteCollectionIds.includes(collection.id);
    const title = collection.title.trim() || "Untitled collection";

    return (
      <div key={`favorites-group:${collection.id}`} className="sidebar__collection">
        <div className="sidebar__item sidebar__item--collection" style={getDepthStyle(0)}>
          <button
          type="button"
          className="sidebar__item-button sidebar__item-button--collection"
          aria-expanded={isExpanded}
          title={title}
          onClick={() => toggleFavoriteCollection(collection.id)}
          >
            <span className={`sidebar__chevron ${isExpanded ? "is-expanded" : ""}`}>
              <ChevronRight size={13} />
            </span>
            {isExpanded ? <FolderOpen size={14} /> : <Folder size={14} />}
            <span>{title}</span>
          </button>
        </div>
        {isExpanded ? (
          <div className="sidebar__children sidebar__children--favorites">
            {group.notes.map((page) =>
              renderNote(page, 1, { scope: "favorites", showDelete: false })
            )}
          </div>
        ) : null}
      </div>
    );
  }

  function renderPageActions(page: PageDto, isDisabled: boolean, menuKey: string) {
    const isMenuOpen = openActionMenuKey === menuKey;
    const isExporting = exportingPageId === page.id;
    const isFavoriting = favoritingPageId === page.id;
    const title =
      page.title.trim() || (page.type === "COLLECTION" ? "Untitled collection" : "Untitled");
    const exportLabel = page.type === "COLLECTION" ? "Export zip" : "Export markdown";

    return (
      <div
        ref={isMenuOpen ? exportMenuRef : undefined}
        className="sidebar__item-menu-wrap"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="sidebar__item-more"
          aria-label={`Open actions for ${title}`}
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          title="Actions"
          disabled={isDisabled || isExporting || isFavoriting}
          onClick={(event) => toggleActionMenu(event, menuKey)}
        >
          <MoreHorizontal size={14} />
        </button>

        {isMenuOpen ? (
          <div className="sidebar__item-menu" role="menu" aria-label={`${title} actions`}>
            {page.type === "NOTE" ? (
              <button
                type="button"
                role="menuitem"
                className={page.favorite ? "is-favorite" : ""}
                disabled={isFavoriting}
                title={page.favorite ? "Remove from favorites" : "Add to favorites"}
                onClick={(event) => toggleFavoriteFromMenu(event, page)}
              >
                <Star size={13} fill={page.favorite ? "currentColor" : "none"} />
                <span>
                  {isFavoriting
                    ? "Updating..."
                    : page.favorite
                      ? "Remove from favorites"
                      : "Add to favorites"}
                </span>
              </button>
            ) : null}
            <button
              type="button"
              role="menuitem"
              disabled={isExporting}
              title={exportLabel}
              onClick={(event) => exportSidebarPage(event, page)}
            >
              <Download size={13} />
              <span>{isExporting ? "Exporting..." : exportLabel}</span>
            </button>
            {page.type === "COLLECTION" ? (
              <button
                type="button"
                role="menuitem"
                disabled={isImportingMarkdown}
                title="Import markdown"
                onClick={(event) => openCollectionImportPicker(event, page.id)}
              >
                <Upload size={13} />
                <span>
                  {importingCollectionId === page.id ? "Importing..." : "Import markdown"}
                </span>
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <aside
      ref={sidebarRef}
      className={`sidebar ${isCollapsed ? "is-collapsed" : ""} ${
        isResizing ? "is-resizing" : ""
      }`}
      style={sidebarStyle}
    >
      <div className="sidebar__top">
        <button
          type="button"
          className="sidebar__brand"
          aria-label="Open Home"
          title="Home"
          onClick={onOpenHome}
        >
          <span className="sidebar__brand-mark">N</span>
          <div>
            <div className="sidebar__brand-title">Nexis</div>
            <div className="sidebar__brand-caption">Workspace</div>
          </div>
        </button>
        <div className="sidebar__top-actions">
          <button
            type="button"
            className="theme-switch"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button
            type="button"
            className="theme-switch"
            onClick={logout}
            aria-label="Logout"
            title="Logout"
          >
            <LogOut size={14} />
          </button>
          <button
            type="button"
            className="sidebar__collapse-button"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={toggleSidebarCollapsed}
          >
            {isCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
          </button>
        </div>
      </div>

      <div ref={createMenuRef} className="sidebar__create">
        <button
          type="button"
          className="sidebar__create-button"
          aria-label="Create"
          title="Create"
          aria-expanded={isCreateMenuOpen}
          disabled={isCreatingPage}
          onClick={() => setIsCreateMenuOpen((current) => !current)}
        >
          <Plus size={15} />
        </button>
        <button
          type="button"
          className="sidebar__import-button"
          aria-label="Import markdown"
          title="Import markdown"
          disabled={isImportingMarkdown}
          onClick={openRootImportPicker}
        >
          <Upload size={14} />
          <span>{isImportingRootMarkdown ? "Importing..." : "Import"}</span>
        </button>
        {isCollapsed ? (
          <button
            type="button"
            className="sidebar__rail-button"
            aria-label="Open search"
            title="Search"
            onClick={onOpenSearch}
          >
            <Search size={14} />
          </button>
        ) : null}
        <input
          ref={rootImportInputRef}
          className="sidebar__file-input"
          type="file"
          accept=".md,text/markdown,text/plain"
          onChange={handleRootImportInputChange}
        />
        <input
          ref={collectionImportInputRef}
          className="sidebar__file-input"
          type="file"
          accept=".md,text/markdown,text/plain"
          onChange={handleCollectionImportInputChange}
        />

        {isCreateMenuOpen ? (
          <div className="sidebar__create-menu" role="menu" aria-label="Create page">
            <button
              type="button"
              role="menuitem"
              title="Create note"
              disabled={isCreatingPage}
              onClick={createRootNote}
            >
              <FileText size={14} />
              <span>Create note</span>
            </button>
            <button
              type="button"
              role="menuitem"
              title="Create collection"
              disabled={isCreatingPage}
              onClick={createRootCollection}
            >
              <Folder size={14} />
              <span>Create collection</span>
            </button>
          </div>
        ) : null}
      </div>

      {!isCollapsed ? (
        <>
          {renderFavoritesSection()}

          <div className="sidebar__label">Pages</div>

          <div className="sidebar__list">
            {isLoading ? (
              <div className="sidebar__state sidebar__state--muted">Loading pages...</div>
            ) : null}
            {!isLoading && errorMessage ? (
              <div className="sidebar__state sidebar__state--error">{errorMessage}</div>
            ) : null}
            {!isLoading && !errorMessage && pages.length === 0 ? (
              <div className="sidebar__state sidebar__state--empty">
                <div>No pages yet</div>
              </div>
            ) : null}
            {!isLoading && pages.map((page) => renderPage(page, 0))}
          </div>

          <div className="sidebar__footer">depedence 2026</div>
        </>
      ) : null}

      <div
        className="sidebar__resize-handle"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize sidebar"
        title="Resize sidebar"
        onPointerDown={handleResizePointerDown}
      />
    </aside>
  );
}

function getDepthStyle(depth: number): SidebarDepthStyle {
  return {
    "--sidebar-depth-offset": `${depth * 14}px`
  };
}

function getStoredSidebarWidth() {
  const storedValue = Number(window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY));

  if (!Number.isFinite(storedValue)) {
    return SIDEBAR_DEFAULT_WIDTH;
  }

  return clamp(storedValue, SIDEBAR_EXPANDED_MIN_WIDTH, SIDEBAR_MAX_WIDTH);
}

function getStoredSidebarCollapsed() {
  return window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "true";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getFavoriteTree(
  favoritePages: PageDto[],
  rootPages: PageDto[],
  childrenByCollectionId: Record<number, PageDto[]>
): FavoriteTree {
  const collectionsById = getCollectionsById(rootPages, childrenByCollectionId);
  const rootNotes: PageDto[] = [];
  const groupsByCollectionId = new Map<number, FavoriteCollectionGroup>();

  sortPages(favoritePages)
    .filter((page) => page.type === "NOTE" && page.favorite)
    .forEach((page) => {
      if (page.parentId === null) {
        rootNotes.push(page);
        return;
      }

      const collection = collectionsById.get(page.parentId);

      if (!collection) {
        rootNotes.push(page);
        return;
      }

      const group = groupsByCollectionId.get(collection.id);

      if (group) {
        group.notes = sortPages([...group.notes, page]);
        return;
      }

      groupsByCollectionId.set(collection.id, {
        collection,
        notes: [page]
      });
    });

  const groups = [...groupsByCollectionId.values()].sort((left, right) =>
    comparePages(left.collection, right.collection)
  );

  return {
    rootNotes: sortPages(rootNotes),
    groups
  };
}

function getCollectionsById(
  rootPages: PageDto[],
  childrenByCollectionId: Record<number, PageDto[]>
) {
  const collectionsById = new Map<number, PageDto>();

  function visit(pages: PageDto[]) {
    pages.forEach((page) => {
      if (page.type !== "COLLECTION") {
        return;
      }

      collectionsById.set(page.id, page);
      visit(childrenByCollectionId[page.id] ?? []);
    });
  }

  visit(rootPages);
  return collectionsById;
}

function sortPages(pages: PageDto[]) {
  return [...pages].sort(comparePages);
}

function comparePages(left: PageDto, right: PageDto) {
  return left.position - right.position || left.id - right.id;
}
