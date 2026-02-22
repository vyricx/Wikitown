import React from "react";
import { PageFull } from "../lib/api";

interface PageViewProps {
  page: PageFull | null;
  loading: boolean;
  onNavigate: (slug: string) => void;
  onEdit?: () => void;
}

export default function PageView({ page, loading, onNavigate, onEdit }: PageViewProps) {
  function renderContent(text: string) {
    const lines = text.split("\n");
    return lines.map((line, i) => {
      // Standalone image
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

      // Standalone audio
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

      // Inline rendering
      let parts = line.split(/\*\*(.*?)\*\*/g);
      const elements = parts.map((part, j) =>
        j % 2 === 1 ? <strong key={j}>{part}</strong> : part
      );

      const processed: React.ReactNode[] = [];
      elements.forEach((el) => {
        if (typeof el === "string") {
          const inlineParts = el.split(/\{\{img:(.*?)(?:\|(.*?))?\}\}/g);
          for (let m = 0; m < inlineParts.length; m++) {
            if (m % 3 === 1) {
              const file = inlineParts[m].trim();
              const alt = inlineParts[m + 1]?.trim() || file;
              processed.push(
                <img key={`img-${i}-${m}`} src={`/media/${file}`} alt={alt} className="wiki-image-inline" />
              );
            } else if (m % 3 === 0) {
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
                        onNavigate(slug);
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

  if (loading) return <p>Loading...</p>;

  if (!page) {
    return (
      <div className="page-not-found">
        <h1>Page not found</h1>
        <p>This page doesn't exist yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="page-header-row">
        <h1 className="page-title">{page.title}</h1>
        {onEdit && (
          <button className="edit-page-btn" onClick={onEdit}>Edit</button>
        )}
      </div>
      {page.category && <span className="page-category">{page.category}</span>}
      <div className="page-body">{renderContent(page.content)}</div>
      <footer className="page-meta">
        Last updated: {new Date(page.updated_at).toLocaleDateString()}
      </footer>
    </>
  );
}
