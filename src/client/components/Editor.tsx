import React, { useState, useEffect, useRef } from "react";
import { fetchPage, savePage } from "../lib/api";
import { wikiToHtml, htmlToWiki } from "../lib/wikiSyntax";

interface EditorProps {
  slug: string;
  onClose: () => void;
}

export default function Editor({ slug, onClose }: EditorProps) {
  const [editorKey, setEditorKey] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [summary, setSummary] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPage(slug).then((page) => {
      if (page) {
        setTitle(page.title);
        setCategory(page.category);
        setSummary(page.summary);
        if (editorRef.current) {
          editorRef.current.innerHTML = wikiToHtml(page.content);
        }
      }
      setLoaded(true);
    });
  }, [slug]);

  function execCmd(cmd: string, value?: string) {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
  }

  function insertLink() {
    const name = prompt("Page name (e.g. Armor):");
    if (!name) return;
    const slug = name.toLowerCase().replace(/\s+/g, "-");
    const html = `<a href="/wiki/${slug}" class="wiki-link">${name}</a>`;
    document.execCommand("insertHTML", false, html);
    editorRef.current?.focus();
  }

  function insertImage() {
    const file = prompt("Image filename (e.g. photo.png):");
    if (!file) return;
    const caption = prompt("Caption (optional):") || "";
    const html = caption
      ? `<figure class="wiki-figure"><img src="/media/${file}" alt="${caption}"><figcaption>${caption}</figcaption></figure>`
      : `<figure class="wiki-figure"><img src="/media/${file}" alt="${file}"></figure>`;
    document.execCommand("insertHTML", false, html);
    editorRef.current?.focus();
  }

  function insertAudio() {
    const file = prompt("Audio filename (e.g. sound.mp3):");
    if (!file) return;
    const title = prompt("Title (optional):") || "";
    const html = `<div class="wiki-audio" data-file="${file}" data-title="${title}"><span class="wiki-audio-title">${title}</span><audio controls preload="none"><source src="/media/${file}"></audio></div>`;
    document.execCommand("insertHTML", false, html);
    editorRef.current?.focus();
  }

  async function handleSave() {
    if (!editorKey) {
      setError("Enter the editor key");
      return;
    }
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setError("");
    setSaving(true);

    const html = editorRef.current?.innerHTML || "";
    const content = htmlToWiki(html);

    try {
      await savePage(slug, { title, content, summary, category }, editorKey);
      onClose();
    } catch (e: any) {
      setError(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  }

  if (!loaded) return <p>Loading editor...</p>;

  return (
    <div className="editor">
      <div className="editor-top">
        <div className="editor-top-left">
          <span className="editor-label">EDIT PAGE</span>
          <span className="editor-slug">{slug}</span>
        </div>
        <div className="editor-top-right">
          <button className="editor-cancel-btn" onClick={onClose}>Cancel</button>
          <button
            className="editor-save-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="editor-key-row">
        <input
          type="password"
          className="editor-key-input"
          placeholder="Editor key"
          value={editorKey}
          onChange={(e) => setEditorKey(e.target.value)}
        />
      </div>

      {error && <div className="editor-error">{error}</div>}

      <div className="editor-fields">
        <div className="editor-field">
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="editor-field-row">
          <div className="editor-field">
            <label>Category</label>
            <input value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>
          <div className="editor-field">
            <label>Summary</label>
            <input value={summary} onChange={(e) => setSummary(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="editor-toolbar">
        <button onClick={() => execCmd("bold")} title="Bold"><b>B</b></button>
        <button onClick={() => execCmd("italic")} title="Italic"><i>I</i></button>
        <div className="toolbar-divider" />
        <button onClick={() => execCmd("insertUnorderedList")} title="Bullet list">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor"/><circle cx="4" cy="12" r="1.5" fill="currentColor"/><circle cx="4" cy="18" r="1.5" fill="currentColor"/></svg>
        </button>
        <button onClick={() => execCmd("insertOrderedList")} title="Numbered list">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2"><line x1="10" y1="6" x2="20" y2="6"/><line x1="10" y1="12" x2="20" y2="12"/><line x1="10" y1="18" x2="20" y2="18"/><text x="2" y="8" fontSize="8" fill="currentColor" stroke="none" fontFamily="sans-serif">1</text><text x="2" y="14" fontSize="8" fill="currentColor" stroke="none" fontFamily="sans-serif">2</text><text x="2" y="20" fontSize="8" fill="currentColor" stroke="none" fontFamily="sans-serif">3</text></svg>
        </button>
        <div className="toolbar-divider" />
        <button onClick={insertLink} title="Insert link">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        </button>
        <button onClick={insertImage} title="Insert image">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
        </button>
        <button onClick={insertAudio} title="Insert audio">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
        </button>
      </div>

      <div
        ref={editorRef}
        className="editor-area"
        contentEditable
        onPaste={handlePaste}
        suppressContentEditableWarning
      />
    </div>
  );
}
