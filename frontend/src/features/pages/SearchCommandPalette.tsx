import { useEffect, useRef, useState } from "react";
import { FileText, Folder, Search } from "lucide-react";
import type { PageDto } from "../../shared/types/page";
import { searchPages } from "./pagesApi";

type SearchCommandPaletteProps = {
  openRequestKey?: number;
  onOpenPage: (page: PageDto) => void;
};

type SearchStatus = "idle" | "loading" | "success" | "error";

export function SearchCommandPalette({ openRequestKey = 0, onOpenPage }: SearchCommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PageDto[]>([]);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const trimmedQuery = query.trim();

  useEffect(() => {
    if (openRequestKey === 0) {
      return;
    }

    openPalette();
  }, [openRequestKey]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(frameId);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (target instanceof Node && rootRef.current?.contains(target)) {
        return;
      }

      closePalette();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closePalette();
        return;
      }

      if (event.key === "ArrowDown" && results.length > 0) {
        event.preventDefault();
        event.stopPropagation();
        setActiveIndex((current) => (current + 1) % results.length);
        return;
      }

      if (event.key === "ArrowUp" && results.length > 0) {
        event.preventDefault();
        event.stopPropagation();
        setActiveIndex((current) => (current - 1 + results.length) % results.length);
        return;
      }

      if (event.key === "Enter" && !event.isComposing && results[activeIndex]) {
        event.preventDefault();
        event.stopPropagation();
        openResult(results[activeIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [activeIndex, isOpen, results]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (!trimmedQuery) {
      setResults([]);
      setStatus("idle");
      setActiveIndex(0);
      return;
    }

    let isStale = false;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void searchPages(trimmedQuery, controller.signal)
        .then((pages) => {
          if (isStale) {
            return;
          }

          setResults(pages);
          setStatus("success");
          setActiveIndex(0);
        })
        .catch(() => {
          if (isStale || controller.signal.aborted) {
            return;
          }

          setResults([]);
          setStatus("error");
          setActiveIndex(0);
        });
    }, 300);

    setResults([]);
    setStatus("loading");
    setActiveIndex(0);

    return () => {
      isStale = true;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [isOpen, trimmedQuery]);

  function openPalette() {
    setIsOpen(true);
  }

  function closePalette() {
    setIsOpen(false);
    setQuery("");
    setResults([]);
    setStatus("idle");
    setActiveIndex(0);
  }

  function openResult(page: PageDto) {
    onOpenPage(page);
    closePalette();
  }

  return (
    <div ref={rootRef} className="quick-search">
      <button
        type="button"
        className="quick-search__trigger"
        aria-label="Open search"
        aria-expanded={isOpen}
        title="Search"
        onClick={openPalette}
      >
        <Search size={13} />
        <span>Search</span>
      </button>

      {isOpen ? (
        <div className="quick-search__panel" role="dialog" aria-label="Search pages">
          <div className="quick-search__input-wrap">
            <Search size={15} />
            <input
              ref={inputRef}
              className="quick-search__input"
              value={query}
              placeholder="Search"
              aria-label="Search"
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <div className="quick-search__body">
            {results.length > 0 ? (
              <div className="quick-search__results" role="listbox" aria-label="Search results">
                {results.map((page, index) => (
                  <button
                    key={page.id}
                    type="button"
                    className={`quick-search__result ${index === activeIndex ? "is-active" : ""}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    title={`Open ${page.title.trim() || "Untitled"}`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => openResult(page)}
                  >
                    <span className="quick-search__result-icon">
                      {page.type === "COLLECTION" ? <Folder size={14} /> : <FileText size={14} />}
                    </span>
                    <span className="quick-search__result-copy">
                      <span className="quick-search__result-title">
                        {page.title.trim() || "Untitled"}
                      </span>
                      <span className="quick-search__result-preview">{getPreview(page)}</span>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="quick-search__message">{getMessage(status, trimmedQuery)}</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function getMessage(status: SearchStatus, query: string) {
  if (!query) {
    return "Start typing to search pages";
  }

  if (status === "loading") {
    return "Searching...";
  }

  if (status === "error") {
    return "Search failed";
  }

  return "No results";
}

function getPreview(page: PageDto) {
  if (page.type === "COLLECTION") {
    return "Collection";
  }

  const content = stripMarkdown(page.content ?? "");

  if (!content) {
    return "Page";
  }

  return content.length > 92 ? `${content.slice(0, 92)}...` : content;
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
