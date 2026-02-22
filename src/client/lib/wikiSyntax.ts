// Convert wiki syntax to HTML string
export function wikiToHtml(wiki: string): string {
  const lines = wiki.split("\n");
  return lines
    .map((line) => {
      // Standalone image
      const imgMatch = line.match(/^\{\{img:(.*?)(?:\|(.*?))?\}\}$/);
      if (imgMatch) {
        const file = imgMatch[1].trim();
        const caption = imgMatch[2]?.trim() || "";
        return `<figure class="wiki-figure"><img src="/media/${file}" alt="${caption || file}"><figcaption>${caption}</figcaption></figure>`;
      }

      // Standalone audio
      const audioMatch = line.match(/^\{\{audio:(.*?)(?:\|(.*?))?\}\}$/);
      if (audioMatch) {
        const file = audioMatch[1].trim();
        const title = audioMatch[2]?.trim() || "";
        return `<div class="wiki-audio" data-file="${file}" data-title="${title}"><span class="wiki-audio-title">${title}</span><audio controls preload="none"><source src="/media/${file}"></audio></div>`;
      }

      // Inline: bold
      let html = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

      // Inline: wiki links [[Page Name]]
      html = html.replace(/\[\[(.*?)\]\]/g, (_, name) => {
        const slug = name.toLowerCase().replace(/\s+/g, "-");
        return `<a href="/wiki/${slug}" class="wiki-link">${name}</a>`;
      });

      // Inline images
      html = html.replace(/\{\{img:(.*?)(?:\|(.*?))?\}\}/g, (_, file, alt) => {
        return `<img src="/media/${file.trim()}" alt="${(alt || file).trim()}" class="wiki-image-inline">`;
      });

      return html;
    })
    .join("<br>");
}

// Convert HTML back to wiki syntax
export function htmlToWiki(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
  return nodeToWiki(doc.body.firstChild!).trim();
}

function nodeToWiki(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || "";
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();

  // Figure → standalone image
  if (tag === "figure") {
    const img = el.querySelector("img");
    const caption = el.querySelector("figcaption");
    if (img) {
      const file = img.src.replace(/^.*\/media\//, "");
      const cap = caption?.textContent || "";
      return cap ? `{{img:${file}|${cap}}}` : `{{img:${file}}}`;
    }
  }

  // Audio container
  if (el.classList.contains("wiki-audio")) {
    const file = el.dataset.file || "";
    const title = el.dataset.title || "";
    return title ? `{{audio:${file}|${title}}}` : `{{audio:${file}}}`;
  }

  // Inline image
  if (tag === "img") {
    const file = el.getAttribute("src")?.replace(/^.*\/media\//, "") || "";
    const alt = el.getAttribute("alt") || "";
    return alt && alt !== file ? `{{img:${file}|${alt}}}` : `{{img:${file}}}`;
  }

  // Bold
  if (tag === "strong" || tag === "b") {
    const inner = childrenToWiki(el);
    return `**${inner}**`;
  }

  // Italic
  if (tag === "em" || tag === "i") {
    return childrenToWiki(el);
  }

  // Wiki link
  if (tag === "a" && el.classList.contains("wiki-link")) {
    return `[[${el.textContent}]]`;
  }

  // Line breaks
  if (tag === "br") return "\n";

  // Div/p act as line breaks
  if (tag === "div" || tag === "p") {
    const inner = childrenToWiki(el);
    return "\n" + inner;
  }

  return childrenToWiki(el);
}

function childrenToWiki(el: HTMLElement): string {
  let result = "";
  el.childNodes.forEach((child) => {
    result += nodeToWiki(child);
  });
  return result;
}
