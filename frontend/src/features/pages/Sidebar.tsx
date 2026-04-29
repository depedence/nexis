import {
  ChevronRight,
  Download,
  FileText,
  Folder,
  FolderOpen,
  MoreHorizontal,
  Moon,
  Pencil,
  Plus,
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
  type MouseEvent
} from "react";
import type { PageDto } from "../../shared/types/page";
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
  onSelectPage: (pageId: number) => void;
  onToggleCollection: (collectionId: number) => void;
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
  onSelectPage,
  onToggleCollection
}: SidebarProps) {
  const { theme, toggleTheme } = useTheme();
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
          onClick={() => onSelectPage(page.id)}
        >
          <FileText size={14} />
          <span>{page.title.trim() || "Untitled"}</span>
        </button>
        {renderPageActions(page, deletingPageId === page.id || isExiting, menuKey)}
        {showDelete ? (
          <button
            type="button"
            className="sidebar__item-delete"
            aria-label={`Delete ${page.title.trim() || "Untitled"}`}
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
        <button
          type="button"
          className="sidebar__import-button"
          disabled={isImportingMarkdown}
          onClick={openRootImportPicker}
        >
          <Upload size={14} />
          <span>{isImportingRootMarkdown ? "Importing..." : "Import"}</span>
        </button>
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

      {renderFavoritesSection()}

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
