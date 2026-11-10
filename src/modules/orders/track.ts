// Shared types and customer-friendly wording for order tracking.
// This file has no "use server", so both the server action and the
// browser form can import it.

// The ONLY order data a customer is ever allowed to see.
// Deliberately excludes: address, notes, admin names, stock levels.
export type PublicOrder = {
  reference: string;
  status: string;
  statusLabel: string;
  statusMessage: string;
  method: "PICKUP" | "DELIVERY";
  placedAt: string;
  items: { name: string; quantity: string; unit: string; lineTotal: string }[];
  subtotal: string;
  deliveryFee: string | null; // null = shop has not set it yet
  total: string | null; // null = depends on the delivery fee
};

export type TrackState = { error?: string; order?: PublicOrder };

// What each status means to a customer (not the internal admin wording).
export function describeStatus(
  status: string,
  method: "PICKUP" | "DELIVERY",
): { label: string; message: string } {
  switch (status) {
    case "PENDING":
      return {
        label: "Received",
        message: "We have your request. The shop will contact you to confirm availability.",
      };
    case "CONFIRMED":
      return { label: "Confirmed", message: "The shop has confirmed your order." };
    case "PROCESSING":
      return { label: "Being prepared", message: "Your order is being prepared." };
    case "READY_FOR_PICKUP":
      return { label: "Ready for pickup", message: "Your order is ready to collect from the shop." };
    case "OUT_FOR_DELIVERY":
      return { label: "Out for delivery", message: "Your order is on its way to you." };
    case "COMPLETED":
      return {
        label: "Completed",
        message: method === "PICKUP" ? "Order collected. Thank you!" : "Order delivered. Thank you!",
      };
    case "CANCELLED":
      return { label: "Cancelled", message: "This order was cancelled. Contact the shop if you have questions." };
    default:
      return { label: status, message: "" };
  }
}