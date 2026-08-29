import Link from "next/link";

export function Pagination({
  page,
  pages,
  makeHref,
}: {
  page: number;
  pages: number;
  makeHref: (p: number) => string;
}) {
  if (pages <= 1) return null;
  const nums: number[] = [];
  const from = Math.max(1, page - 3);
  const to = Math.min(pages, from + 6);
  for (let i = from; i <= to; i++) nums.push(i);

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-1 text-sm">
      {page > 1 && (
        <Link href={makeHref(page - 1)} className="border border-line px-3 py-1.5 hover:bg-soft">
          ‹
        </Link>
      )}
      {from > 1 && (
        <>
          <Link href={makeHref(1)} className="border border-line px-3 py-1.5 hover:bg-soft">
            1
          </Link>
          <span className="px-1 text-faint">…</span>
        </>
      )}
      {nums.map((n) => (
        <Link
          key={n}
          href={makeHref(n)}
          className={`border px-3 py-1.5 ${
            n === page ? "border-brand bg-brand text-white" : "border-line hover:bg-soft"
          }`}
        >
          {n}
        </Link>
      ))}
      {to < pages && (
        <>
          <span className="px-1 text-faint">…</span>
          <Link href={makeHref(pages)} className="border border-line px-3 py-1.5 hover:bg-soft">
            {pages}
          </Link>
        </>
      )}
      {page < pages && (
        <Link href={makeHref(page + 1)} className="border border-line px-3 py-1.5 hover:bg-soft">
          ›
        </Link>
      )}
    </nav>
  );
}
