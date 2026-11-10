export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "READY_FOR_PICKUP",
  "OUT_FOR_DELIVERY",
  "COMPLETED",
  "CANCELLED",
] as const;

export type OrderStatusValue = (typeof ORDER_STATUSES)[number];
export type MethodValue = "PICKUP" | "DELIVERY";

export const STATUS_LABEL: Record<OrderStatusValue, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  READY_FOR_PICKUP: "Ready for pickup",
  OUT_FOR_DELIVERY: "Out for delivery",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export function advanceOptions(
  status: OrderStatusValue,
  method: MethodValue,
): OrderStatusValue[] {
  switch (status) {
    case "CONFIRMED":
      return ["PROCESSING"];
    case "PROCESSING":
      return [method === "PICKUP" ? "READY_FOR_PICKUP" : "OUT_FOR_DELIVERY"];
    case "READY_FOR_PICKUP":
    case "OUT_FOR_DELIVERY":
      return ["COMPLETED"];
    default:
      return [];
  }
}

export const CANCELLABLE: OrderStatusValue[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "READY_FOR_PICKUP",
];