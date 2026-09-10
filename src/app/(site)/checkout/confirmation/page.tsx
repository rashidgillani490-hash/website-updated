import type { Metadata } from "next";
import { OrderConfirmation } from "@/components/checkout/OrderConfirmation";

export const metadata: Metadata = {
  title: "Order received",
  robots: { index: false, follow: false },
};

export default function ConfirmationPage() {
  return <OrderConfirmation />;
}
