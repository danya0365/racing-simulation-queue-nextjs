import { BookingWizard } from "@/src/presentation/components/customer/BookingWizard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "จองคิว | Racing Queue",
  description: "จองคิวเครื่องเล่น Racing Simulator แบบง่ายๆ ไม่กี่ขั้นตอน",
};

export default function BookingPage() {
  return <BookingWizard />;
}
