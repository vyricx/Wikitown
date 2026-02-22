import React, { useState, useEffect } from "react";

interface PageSummary {
  id: number;
  slug: string;
  title: string;
  summary: string;
  category: string;
  updated_at: string;
}

interface PageFull {
  id: number;
  slug: string;
  title: string;
  content: string;
  summary: string;
  category: string;
  created_at: string;
  updated_at: string;
}

const EDITOR_KEY = "EditorKeyWikitown2026xQ9mR4bL7pZwNcYsV3jKd8fHgTaU";

function KeyIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );
}

export default function App() {
  const [currentSlug, setCurrentSlug] = useState<string | null>(null);
  const [page, setPage] = useState<PageFull | null>(null);
  const [pages, setPages] = useState<PageSummary[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(false);

  // Auth & editing
  const [showKeyPanel, setShowKeyPanel] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [keyError, setKeyError] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editCategory, setEditCategory] = useState("");

  // Handle browser back/forward
  useEffect(() => {
    const slug = window.location.pathname.replace(/^\/wiki\//, "") || null;
    if (slug && slug !== "/") {
      setCurrentSlug(slug);
    } else {
      setCurrentSlug("main-page");
    }

    const onPop = () => {
      const s = window.location.pathname.replace(/^\/wiki\//, "") || "main-page";
      setCurrentSlug(s);
      setEditing(false);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Fetch categories on mount
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(console.error);
  }, []);

  // Fetch page when slug changes
  useEffect(() => {
    if (!currentSlug) return;
    setLoading(true);
    setEditing(false);
    fetch(`/api/pages/${currentSlug}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => {
        setPage(data);
        setLoading(false);
      })
      .catch(() => {
        setPage(null);
        setLoading(false);
      });
  }, [currentSlug]);

  // Search pages
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (selectedCategory) params.set("category", selectedCategory);

    fetch(`/api/pages?${params}`)
      .then((r) => r.json())
      .then(setPages)
      .catch(console.error);
  }, [search, selectedCategory]);

  function navigateTo(slug: string) {
    window.history.pushState({}, "", `/wiki/${slug}`);
    setCurrentSlug(slug);
  }

  function handleKeySubmit() {
    if (keyInput === EDITOR_KEY) {
      setAuthenticated(true);
      setShowKeyPanel(false);
      setKeyInput("");
      setKeyError("");
    } else {
      setKeyError("Invalid key");
    }
  }

  function startEditing() {
    if (!page) return;
    setEditTitle(page.title);
    setEditContent(page.content);
    setEditSummary(page.summary);
    setEditCategory(page.category);
    setEditing(true);
  }

  async function savePage() {
    if (!page || !currentSlug) return;
    const res = await fetch(`/api/pages/${currentSlug}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Editor-Key": EDITOR_KEY,
      },
      body: JSON.stringify({
        title: editTitle,
        content: editContent,
        summary: editSummary,
        category: editCategory,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setPage(updated);
      setEditing(false);
    }
  }

  // Simple markdown-like rendering (bold, links, newlines)
  function renderContent(text: string) {
    const lines = text.split("\n");
    return lines.map((line, i) => {
      let parts = line.split(/\*\*(.*?)\*\*/g);
      const elements = parts.map((part, j) =>
        j % 2 === 1 ? <strong key={j}>{part}</strong> : part
      );

      const processed: React.ReactNode[] = [];
      elements.forEach((el) => {
        if (typeof el === "string") {
          const linkParts = el.split(/\[\[(.*?)\]\]/g);
          linkParts.forEach((lp, k) => {
            if (k % 2 === 1) {
              const slug = lp.toLowerCase().replace(/\s+/g, "-");
              processed.push(
                <a
                  key={`link-${i}-${k}`}
                  href={`/wiki/${slug}`}
                  className="wiki-link"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateTo(slug);
                  }}
                >
                  {lp}
                </a>
              );
            } else {
              processed.push(lp);
            }
          });
        } else {
          processed.push(el);
        }
      });

      return (
        <React.Fragment key={i}>
          {processed}
          {i < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  }

  return (
    <div className="wiki">
      <header className="wiki-header">
        <div className="wiki-header-inner">
          <h1 className="wiki-logo" onClick={() => navigateTo("main-page")}>
            Wikitown
          </h1>
          <div className="wiki-header-right">
            <div className="wiki-search">
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              className={`key-btn ${authenticated ? "authenticated" : ""}`}
              onClick={() => {
                if (authenticated) {
                  setAuthenticated(false);
                  setEditing(false);
                } else {
                  setShowKeyPanel(true);
                }
              }}
              title={authenticated ? "Lock editor" : "Unlock editor"}
            >
              <KeyIcon />
            </button>
          </div>
        </div>
      </header>

      {showKeyPanel && (
        <div className="key-overlay" onClick={() => setShowKeyPanel(false)}>
          <div className="key-panel" onClick={(e) => e.stopPropagation()}>
            <h2>Editor Key</h2>
            <p>Enter the 50-character editor key to unlock editing.</p>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => {
                setKeyInput(e.target.value);
                setKeyError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleKeySubmit()}
              placeholder="Enter key..."
              autoFocus
            />
            {keyError && <div className="key-error">{keyError}</div>}
            <div className="key-panel-actions">
              <button onClick={() => setShowKeyPanel(false)}>Cancel</button>
              <button className="primary" onClick={handleKeySubmit}>
                Unlock
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="wiki-body">
        <nav className="wiki-sidebar">
          <h3>Categories</h3>
          <ul>
            <li>
              <a
                href="#"
                className={selectedCategory === "" ? "active" : ""}
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedCategory("");
                }}
              >
                All
              </a>
            </li>
            {categories.map((cat) => (
              <li key={cat}>
                <a
                  href="#"
                  className={selectedCategory === cat ? "active" : ""}
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedCategory(cat);
                  }}
                >
                  {cat}
                </a>
              </li>
            ))}
          </ul>

          <h3>Pages</h3>
          <ul className="wiki-page-list">
            {pages.map((p) => (
              <li key={p.id}>
                <a
                  href={`/wiki/${p.slug}`}
                  onClick={(e) => {
                    e.preventDefault();
                    navigateTo(p.slug);
                  }}
                >
                  {p.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <main className="wiki-content">
          {loading ? (
            <p>Loading...</p>
          ) : page ? (
            <>
              {authenticated && !editing && (
                <div className="edit-bar">
                  <button onClick={startEditing}>Edit page</button>
                </div>
              )}

              {editing ? (
                <>
                  <div className="edit-bar">
                    <button className="save-btn" onClick={savePage}>Save</button>
                    <button onClick={() => setEditing(false)}>Cancel</button>
                  </div>
                  <div className="edit-field">
                    <label>Title</label>
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                  </div>
                  <div className="edit-field">
                    <label>Category</label>
                    <input
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                    />
                  </div>
                  <div className="edit-field">
                    <label>Summary</label>
                    <input
                      value={editSummary}
                      onChange={(e) => setEditSummary(e.target.value)}
                    />
                  </div>
                  <div className="edit-field">
                    <label>Content</label>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <>
                  <h1 className="page-title">{page.title}</h1>
                  {page.category && (
                    <span className="page-category">{page.category}</span>
                  )}
                  <div className="page-body">
                    {renderContent(page.content)}
                  </div>
                  <footer className="page-meta">
                    Last updated:{" "}
                    {new Date(page.updated_at).toLocaleDateString()}
                  </footer>
                </>
              )}
            </>
          ) : (
            <div className="page-not-found">
              <h1>Page not found</h1>
              <p>This page doesn't exist yet.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
