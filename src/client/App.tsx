import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import PageView from "./components/PageView";
import FrontPage from "./components/FrontPage";
import Editor from "./components/Editor";
import { fetchPage, fetchPages, fetchCategories, PageFull, PageSummary, CategoryInfo } from "./lib/api";

export default function App() {
  const [currentSlug, setCurrentSlug] = useState<string | null>(null);
  const [editSlug, setEditSlug] = useState<string | null>(null);
  const [page, setPage] = useState<PageFull | null>(null);
  const [pages, setPages] = useState<PageSummary[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(false);

  // Parse route on load and on popstate
  useEffect(() => {
    function parseRoute() {
      const path = window.location.pathname;
      const editMatch = path.match(/^\/wiki\/edit\/([a-z0-9-]+)$/);
      if (editMatch) {
        setEditSlug(editMatch[1]);
        setCurrentSlug(null);
        return;
      }
      setEditSlug(null);
      const slug = path.replace(/^\/wiki\//, "") || "main-page";
      setCurrentSlug(slug === "/" || slug === "" ? "main-page" : slug);
    }

    parseRoute();
    window.addEventListener("popstate", parseRoute);
    return () => window.removeEventListener("popstate", parseRoute);
  }, []);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories().then(setCategories).catch(console.error);
  }, []);

  // Fetch page when slug changes
  useEffect(() => {
    if (!currentSlug || currentSlug === "main-page") return;
    setLoading(true);
    fetchPage(currentSlug)
      .then((data) => {
        setPage(data);
        setLoading(false);
      })
      .catch(() => {
        setPage(null);
        setLoading(false);
      });
  }, [currentSlug]);

  // Search/filter pages
  useEffect(() => {
    fetchPages(search || undefined, selectedCategory || undefined)
      .then(setPages)
      .catch(console.error);
  }, [search, selectedCategory]);

  function navigateTo(slug: string) {
    window.history.pushState({}, "", `/wiki/${slug}`);
    setEditSlug(null);
    setCurrentSlug(slug);
    if (slug === "main-page") setPage(null);
  }

  function navigateToEdit(slug: string) {
    window.history.pushState({}, "", `/wiki/edit/${slug}`);
    setEditSlug(slug);
    setCurrentSlug(null);
  }

  function handleSelectCategory(cat: string) {
    setSelectedCategory(cat);
    if (currentSlug === "main-page" || editSlug) {
      navigateTo(cat ? "main-page" : "main-page");
    }
  }

  // Determine what to render in the main content area
  function renderContent() {
    if (editSlug) {
      return (
        <Editor
          slug={editSlug}
          onClose={() => navigateTo(editSlug)}
        />
      );
    }

    if (currentSlug === "main-page") {
      return (
        <FrontPage
          categories={categories}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
          }}
        />
      );
    }

    return (
      <PageView
        page={page}
        loading={loading}
        onNavigate={navigateTo}
        onEdit={currentSlug ? () => navigateToEdit(currentSlug) : undefined}
      />
    );
  }

  return (
    <div className="wiki">
      <Header
        search={search}
        onSearchChange={setSearch}
        onLogoClick={() => navigateTo("main-page")}
      />
      <div className="wiki-body">
        <Sidebar
          categories={categories}
          pages={pages}
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
          onNavigate={navigateTo}
        />
        <main className="wiki-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
