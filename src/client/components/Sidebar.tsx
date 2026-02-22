import React from "react";
import { CategoryInfo, PageSummary } from "../lib/api";

interface SidebarProps {
  categories: CategoryInfo[];
  pages: PageSummary[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onNavigate: (slug: string) => void;
}

export default function Sidebar({
  categories,
  pages,
  selectedCategory,
  onSelectCategory,
  onNavigate,
}: SidebarProps) {
  return (
    <nav className="wiki-sidebar">
      <h3>Categories</h3>
      <ul>
        <li>
          <a
            href="#"
            className={selectedCategory === "" ? "active" : ""}
            onClick={(e) => {
              e.preventDefault();
              onSelectCategory("");
            }}
          >
            All
          </a>
        </li>
        {categories.map((c) => (
          <li key={c.category}>
            <a
              href="#"
              className={selectedCategory === c.category ? "active" : ""}
              onClick={(e) => {
                e.preventDefault();
                onSelectCategory(c.category);
              }}
            >
              {c.category}
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
                onNavigate(p.slug);
              }}
            >
              {p.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
