export function formatEtb(value: string | number): string {
  return (
    "ETB " +
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value))
  );
}