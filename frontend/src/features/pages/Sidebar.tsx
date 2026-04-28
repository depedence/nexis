import { FileText, Moon, Plus, Sun, Trash2 } from "lucide-react";
import type { PageDto } from "../../shared/types/page";
import { useTheme } from "../../shared/ui/ThemeProvider";

type SidebarProps = {
  pages: PageDto[];
  selectedPageId: number | null;
  isLoading: boolean;
  errorMessage: string | null;
  isCreatingPage: boolean;
  deletingPageId: number | null;
  exitingPageIds: number[];
  onCreatePage: () => void;
  onDeletePage: (pageId: number) => void;
  onSelectPage: (pageId: number) => void;
};

export function Sidebar({
  pages,
  selectedPageId,
  isLoading,
  errorMessage,
  isCreatingPage,
  deletingPageId,
  exitingPageIds,
  onCreatePage,
  onDeletePage,
  onSelectPage
}: SidebarProps) {
  const { theme, toggleTheme } = useTheme();

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

      <button
        type="button"
        className="sidebar__new-page"
        disabled={isCreatingPage}
        onClick={onCreatePage}
      >
        <Plus size={14} />
        {isCreatingPage ? "Creating..." : "New page"}
      </button>

      <div className="sidebar__label">Pages</div>

      <div className="sidebar__list">
        {isLoading ? <div className="sidebar__state sidebar__state--muted">Loading pages...</div> : null}
        {!isLoading && errorMessage ? <div className="sidebar__state sidebar__state--error">{errorMessage}</div> : null}
        {!isLoading && !errorMessage && pages.length === 0 ? (
          <div className="sidebar__state sidebar__state--empty">
            <div>No pages yet</div>
            <span>Create the first page to start writing.</span>
          </div>
        ) : null}
        {!isLoading &&
          pages.map((page) => (
            <div
              key={page.id}
              className={`sidebar__item ${selectedPageId === page.id ? "is-active" : ""} ${
                exitingPageIds.includes(page.id) ? "is-exiting" : ""
              }`}
            >
              <button
                type="button"
                className="sidebar__item-button"
                disabled={exitingPageIds.includes(page.id)}
                onClick={() => onSelectPage(page.id)}
              >
                <FileText size={14} />
                <span>{page.title.trim() || "Untitled"}</span>
              </button>
              <button
                type="button"
                className="sidebar__item-delete"
                aria-label={`Delete ${page.title}`}
                disabled={deletingPageId === page.id || exitingPageIds.includes(page.id)}
                onClick={() => onDeletePage(page.id)}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
      </div>

      <div className="sidebar__footer">depedence 2026</div>
    </aside>
  );
}
