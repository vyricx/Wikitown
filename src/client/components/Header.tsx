import React from "react";

interface HeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  onLogoClick: () => void;
}

export default function Header({ search, onSearchChange, onLogoClick }: HeaderProps) {
  return (
    <header className="wiki-header">
      <div className="wiki-header-inner">
        <h1 className="wiki-logo" onClick={onLogoClick}>
          Wikitown
        </h1>
        <div className="wiki-search">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
    </header>
  );
}
