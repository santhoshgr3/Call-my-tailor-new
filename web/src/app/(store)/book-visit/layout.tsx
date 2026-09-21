import { BookingProvider } from "@/components/booking/BookingProvider";

export default function BookVisitLayout({ children }: { children: React.ReactNode }) {
  return <BookingProvider>{children}</BookingProvider>;
}
