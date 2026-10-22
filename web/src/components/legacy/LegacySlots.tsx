"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** Mounts live components into placeholder elements (by id) inside server-rendered legacy HTML. */
export function LegacySlots({ slots }: { slots: Record<string, ReactNode> }) {
  const [targets, setTargets] = useState<Record<string, HTMLElement>>({});
  useEffect(() => {
    const found: Record<string, HTMLElement> = {};
    for (const id of Object.keys(slots)) {
      const el = document.getElementById(id);
      if (el) found[id] = el;
    }
    setTargets(found);
  }, [slots]);
  return (
    <>
      {Object.entries(targets).map(([id, el]) => createPortal(slots[id], el, id))}
    </>
  );
}
