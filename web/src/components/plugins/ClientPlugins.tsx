"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";

/* ---------- Announcement bar ---------- */
export function AnnouncementBar({
  message,
  link,
  linkLabel,
  bg,
  fg,
  dismissible,
}: {
  message: string;
  link: string;
  linkLabel: string;
  bg: string;
  fg: string;
  dismissible: boolean;
}) {
  const key = "cmt_ann_" + message.length + "_" + message.slice(0, 12);
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    try {
      if (dismissible && localStorage.getItem(key)) setHidden(true);
    } catch {
      /* private mode */
    }
  }, [key, dismissible]);
  if (hidden || !message) return null;
  return (
    <div style={{ background: bg, color: fg }} className="relative text-center text-[13px]">
      <div className="container-cmt py-2 pr-8">
        {message}
        {link && linkLabel && (
          <a href={link} className="ml-2 font-bold underline">
            {linkLabel}
          </a>
        )}
      </div>
      {dismissible && (
        <button
          aria-label="Close announcement"
          onClick={() => {
            setHidden(true);
            try {
              localStorage.setItem(key, "1");
            } catch {
              /* ignore */
            }
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-lg leading-none opacity-80 hover:opacity-100"
        >
          ×
        </button>
      )}
    </div>
  );
}

/* ---------- Promo popup ---------- */
export function PromoPopup({
  title,
  text,
  image,
  collectEmail,
  buttonLabel,
  buttonLink,
  delay,
  repeatDays,
}: {
  title: string;
  text: string;
  image: string;
  collectEmail: boolean;
  buttonLabel: string;
  buttonLink: string;
  delay: number;
  repeatDays: number;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const blocked = /^\/(checkout|cart|account)/.test(path);

  useEffect(() => {
    if (blocked) return;
    try {
      const last = Number(localStorage.getItem("cmt_popup_ts") || 0);
      if (repeatDays > 0 && last && Date.now() - last < repeatDays * 86_400_000) return;
    } catch {
      /* ignore */
    }
    const t = setTimeout(() => setOpen(true), Math.max(0, delay) * 1000);
    return () => clearTimeout(t);
  }, [blocked, delay, repeatDays]);

  function close() {
    setOpen(false);
    try {
      localStorage.setItem("cmt_popup_ts", String(Date.now()));
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("busy");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setState(res.ok ? "done" : "error");
      if (res.ok) {
        try {
          localStorage.setItem("cmt_popup_ts", String(Date.now()));
        } catch {
          /* ignore */
        }
      }
    } catch {
      setState("error");
    }
  }

  if (!open || blocked) return null;
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-black/60 p-4" onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-md overflow-hidden rounded-lg bg-white shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          aria-label="Close"
          onClick={close}
          className="absolute right-3 top-2 z-10 text-2xl leading-none text-faint hover:text-brand"
        >
          ×
        </button>
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="max-h-48 w-full object-cover" />
        )}
        <div className="p-6 text-center">
          <h2 className="text-xl font-bold text-brand-dark">{title}</h2>
          {text && <p className="mt-2 text-sm text-muted">{text}</p>}
          {collectEmail ? (
            state === "done" ? (
              <p className="mt-4 text-sm font-semibold text-green-700">Thank you — you’re on the list!</p>
            ) : (
              <form onSubmit={submit} className="mt-4 space-y-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="w-full rounded border border-line px-3 py-2 text-sm outline-none focus:border-brand"
                />
                <button className="btn-brand w-full" disabled={state === "busy"}>
                  {state === "busy" ? "Please wait…" : buttonLabel || "Sign me up"}
                </button>
                {state === "error" && <p className="text-xs text-brand">Please enter a valid email.</p>}
              </form>
            )
          ) : (
            buttonLink && (
              <a href={buttonLink} onClick={close} className="btn-brand mt-4 inline-flex">
                {buttonLabel || "Learn more"}
              </a>
            )
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Cookie notice ---------- */
export function CookieNotice({
  message,
  buttonLabel,
  linkLabel,
  link,
}: {
  message: string;
  buttonLabel: string;
  linkLabel: string;
  link: string;
}) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      if (!localStorage.getItem("cmt_cookie_ok")) setShow(true);
    } catch {
      setShow(true);
    }
  }, []);
  if (!show) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-[80] border-t border-line bg-white p-3 shadow-pop md:bottom-4 md:left-4 md:right-auto md:max-w-sm md:rounded-lg md:border">
      <p className="text-xs text-muted">
        {message}{" "}
        {link && linkLabel && (
          <a href={link} className="font-semibold text-brand underline">
            {linkLabel}
          </a>
        )}
      </p>
      <button
        onClick={() => {
          setShow(false);
          try {
            localStorage.setItem("cmt_cookie_ok", "1");
          } catch {
            /* ignore */
          }
        }}
        className="btn-brand mt-2 !py-1.5 !text-[11px]"
      >
        {buttonLabel || "Accept"}
      </button>
    </div>
  );
}

/* ---------- Back to top ---------- */
export function BackToTop({ position }: { position: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 500);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  if (!show) return null;
  return (
    <button
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed bottom-24 z-40 grid h-11 w-11 place-items-center rounded-full bg-brand-dark text-lg text-white shadow-pop hover:bg-brand md:bottom-6 ${
        position === "right" ? "right-5 md:bottom-24" : "left-5"
      }`}
    >
      ↑
    </button>
  );
}

/* ---------- Mobile bottom bar ---------- */
export function MobileBottomBar({
  homeLabel,
  searchLabel,
  cartLabel,
  accountLabel,
}: {
  homeLabel: string;
  searchLabel: string;
  cartLabel: string;
  accountLabel: string;
}) {
  const { count, setDrawerOpen } = useCart();
  const path = usePathname();
  const item = "flex flex-col items-center gap-0.5 py-1.5 text-[10px] font-semibold uppercase";
  return (
    <nav
      aria-label="Quick navigation"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line bg-white md:hidden"
    >
      <Link href="/" className={`${item} ${path === "/" ? "text-brand" : "text-muted"}`}>
        <span className="text-lg leading-none">⌂</span>
        {homeLabel}
      </Link>
      <Link href="/search" className={`${item} ${path.startsWith("/search") ? "text-brand" : "text-muted"}`}>
        <span className="text-lg leading-none">⌕</span>
        {searchLabel}
      </Link>
      <button onClick={() => setDrawerOpen(true)} className={`${item} relative text-muted`}>
        <span className="relative text-lg leading-none">
          🛍
          {count > 0 && (
            <span className="absolute -right-3 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[9px] font-bold text-white">
              {count}
            </span>
          )}
        </span>
        {cartLabel}
      </button>
      <Link href="/account" className={`${item} ${path.startsWith("/account") ? "text-brand" : "text-muted"}`}>
        <span className="text-lg leading-none">☺</span>
        {accountLabel}
      </Link>
    </nav>
  );
}

/* ---------- Custom code injection ---------- */
export function CustomCode({ headHtml, bodyHtml }: { headHtml: string; bodyHtml: string }) {
  const added = useRef<Node[]>([]);
  useEffect(() => {
    const inject = (html: string, parent: HTMLElement) => {
      if (!html.trim()) return;
      const frag = document.createRange().createContextualFragment(html);
      const nodes = Array.from(frag.childNodes);
      parent.appendChild(frag);
      added.current.push(...nodes);
    };
    inject(headHtml, document.head);
    inject(bodyHtml, document.body);
    const nodes = added.current;
    return () => {
      nodes.forEach((n) => n.parentNode?.removeChild(n));
      added.current = [];
    };
  }, [headHtml, bodyHtml]);
  return null;
}

/* ---------- Maintenance gate ---------- */
export function MaintenanceGate({
  title,
  message,
  children,
}: {
  title: string;
  message: string;
  children: React.ReactNode;
}) {
  const path = usePathname();
  // keep the login pages reachable so an admin can sign in
  if (path.startsWith("/account")) return <>{children}</>;
  return (
    <div className="grid min-h-screen place-items-center bg-white p-6 text-center">
      <div className="max-w-md">
        <p className="text-5xl">🚧</p>
        <h1 className="mt-4 text-2xl font-bold text-brand-dark">{title}</h1>
        <p className="mt-3 text-sm text-muted">{message}</p>
        <Link href="/account/login" className="mt-6 inline-block text-xs text-faint hover:text-brand">
          Admin login
        </Link>
      </div>
    </div>
  );
}
