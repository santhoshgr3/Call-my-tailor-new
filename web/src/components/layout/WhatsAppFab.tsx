export function WhatsAppFab({ number }: { number: string }) {
  const n = (number || "918882222900").replace(/[^\d]/g, "");
  return (
    <a
      href={`https://api.whatsapp.com/send?phone=${n}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-wa text-2xl text-white shadow-pop transition-transform hover:scale-105"
    >
      <svg viewBox="0 0 32 32" className="h-8 w-8 fill-current" aria-hidden>
        <path d="M16 3C9 3 3.5 8.5 3.5 15.5c0 2.4.7 4.7 1.9 6.7L3 29l7-1.8c1.9 1 4 1.6 6.1 1.6 7 0 12.5-5.5 12.5-12.5S23 3 16 3zm0 22.6c-1.9 0-3.7-.5-5.3-1.5l-.4-.2-4.1 1.1 1.1-4-.3-.4a10 10 0 01-1.6-5.5C5.5 9.9 10.2 5.2 16 5.2S26.5 9.9 26.5 15.6 21.8 25.6 16 25.6zm5.8-7.5c-.3-.2-1.9-.9-2.2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.3-.7.1a8 8 0 01-2.4-1.5 9 9 0 01-1.7-2.1c-.2-.3 0-.5.1-.7l.5-.6c.2-.2.2-.3.3-.5s0-.4 0-.6l-1-2.3c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4a3.4 3.4 0 00-1 2.5c0 1.5 1 2.9 1.2 3.1s2.1 3.2 5.1 4.5c1.9.8 2.6.9 3.5.7.6-.1 1.9-.8 2.1-1.5s.3-1.4.2-1.5-.3-.3-.6-.4z" />
      </svg>
    </a>
  );
}
