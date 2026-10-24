"use client";

import { useMemo, useState } from "react";

type Item = { id: string; imageUrl: string; category: string; caption: string | null };

/**
 * Gallery in the old site's markup (nav-pills filter + 4-up cards). Must be rendered inside .legacy-page,
 * which supplies the styling.
 */
export function GalleryView({ items }: { items: Item[] }) {
  const cats = useMemo(() => Array.from(new Set(items.map((i) => i.category).filter(Boolean))), [items]);
  const [tab, setTab] = useState("All Work");
  const [shown, setShown] = useState(24);
  const [lightbox, setLightbox] = useState<Item | null>(null);
  const visible = tab === "All Work" ? items : items.filter((i) => i.category === tab);
  const list = visible.slice(0, shown);

  return (
    <div className="container-fluid mt-5">
      <div className="row">
        <div className="col-sm-12">
          <div className="row category">
            <ul className="nav nav-pills">
              {["All Work", ...cats].map((label) => (
                <li key={label} className={tab === label ? "active" : ""}>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setTab(label);
                      setShown(24);
                    }}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="tab-content">
              {visible.length === 0 ? (
                <p style={{ padding: "60px 0", textAlign: "center" }}>No photos here yet.</p>
              ) : (
                <div id="menu" className="cmt-gal-grid">
                  {list.map((g) => (
                    <div className="card" key={g.id}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={g.imageUrl}
                        alt={g.caption || "Our work"}
                        loading="lazy"
                        style={{ cursor: "pointer" }}
                        onClick={() => setLightbox(g)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {visible.length > shown && (
            <div style={{ margin: "20px 0", textAlign: "center" }}>
              <button type="button" onClick={() => setShown((n) => n + 24)}>
                Load more
              </button>
            </div>
          )}
        </div>
      </div>
      {lightbox && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 100, display: "grid", placeItems: "center", background: "rgba(0,0,0,.85)", padding: 16 }}
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            aria-label="Close"
            style={{ position: "absolute", right: 16, top: 12, background: "none", width: "auto", height: "auto", fontSize: 32, lineHeight: 1, padding: 0, margin: 0 }}
          >
            ×
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox.imageUrl}
            alt={lightbox.caption || "Our work"}
            style={{ maxHeight: "90vh", maxWidth: "100%", objectFit: "contain" }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
