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

export default function App() {
  const [currentSlug, setCurrentSlug] = useState<string | null>(null);
  const [page, setPage] = useState<PageFull | null>(null);
  const [pages, setPages] = useState<PageSummary[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(false);

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

  // Render content with wiki syntax:
  // **bold**, [[Page Name]] links, {{img:file.png|caption}}, {{audio:file.mp3|title}}
  function renderContent(text: string) {
    const lines = text.split("\n");
    return lines.map((line, i) => {
      // Check for standalone image line: {{img:filename.png|caption}}
      const imgMatch = line.match(/^\{\{img:(.*?)(?:\|(.*?))?\}\}$/);
      if (imgMatch) {
        const file = imgMatch[1].trim();
        const caption = imgMatch[2]?.trim();
        return (
          <figure key={i} className="wiki-figure">
            <img src={`/media/${file}`} alt={caption || file} className="wiki-image" />
            {caption && <figcaption>{caption}</figcaption>}
          </figure>
        );
      }

      // Check for standalone audio line: {{audio:filename.mp3|title}}
      const audioMatch = line.match(/^\{\{audio:(.*?)(?:\|(.*?))?\}\}$/);
      if (audioMatch) {
        const file = audioMatch[1].trim();
        const title = audioMatch[2]?.trim();
        return (
          <div key={i} className="wiki-audio">
            {title && <span className="wiki-audio-title">{title}</span>}
            <audio controls preload="none">
              <source src={`/media/${file}`} />
            </audio>
          </div>
        );
      }

      // Inline rendering: bold + wiki links
      let parts = line.split(/\*\*(.*?)\*\*/g);
      const elements = parts.map((part, j) =>
        j % 2 === 1 ? <strong key={j}>{part}</strong> : part
      );

      const processed: React.ReactNode[] = [];
      elements.forEach((el) => {
        if (typeof el === "string") {
          // Handle inline images {{img:file.png}}
          const inlineParts = el.split(/\{\{img:(.*?)(?:\|(.*?))?\}\}/g);
          for (let m = 0; m < inlineParts.length; m++) {
            if (m % 3 === 1) {
              const file = inlineParts[m].trim();
              const alt = inlineParts[m + 1]?.trim() || file;
              processed.push(
                <img key={`img-${i}-${m}`} src={`/media/${file}`} alt={alt} className="wiki-image-inline" />
              );
            } else if (m % 3 === 0) {
              // Process wiki links in remaining text
              const linkParts = inlineParts[m].split(/\[\[(.*?)\]\]/g);
              linkParts.forEach((lp, k) => {
                if (k % 2 === 1) {
                  const slug = lp.toLowerCase().replace(/\s+/g, "-");
                  processed.push(
                    <a
                      key={`link-${i}-${m}-${k}`}
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
            }
          }
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
          <div className="wiki-search">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </header>

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
              <h1 className="page-title">{page.title}</h1>
              {page.category && (
                <span className="page-category">{page.category}</span>
              )}
              <div className="page-body">{renderContent(page.content)}</div>
              <footer className="page-meta">
                Last updated: {new Date(page.updated_at).toLocaleDateString()}
              </footer>
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
