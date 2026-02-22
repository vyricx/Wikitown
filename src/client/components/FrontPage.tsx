import React from "react";
import { CategoryInfo } from "../lib/api";

interface FrontPageProps {
  categories: CategoryInfo[];
  onSelectCategory: (cat: string) => void;
}

export default function FrontPage({ categories, onSelectCategory }: FrontPageProps) {
  return (
    <div className="frontpage">
      <div className="frontpage-welcome">
        <h1 className="frontpage-title">Welcome to Wikitown</h1>
        <p className="frontpage-desc">
          Your community-built encyclopedia. Browse articles by category or use
          the search bar to find what you're looking for.
        </p>
      </div>

      {categories.length > 0 && (
        <>
          <h2 className="frontpage-section-title">Browse by Category</h2>
          <div className="frontpage-grid">
            {categories.map((c) => (
              <div
                key={c.category}
                className="category-card"
                onClick={() => onSelectCategory(c.category)}
              >
                <div className="category-card-img">
                  {c.image ? (
                    <img src={`/media/${c.image}`} alt={c.category} />
                  ) : (
                    <div className="category-card-placeholder">
                      {c.category.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="category-card-label">{c.category}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
