import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db/client";

export const PAGE_SIZE = 12;

export type SortKey = "newest" | "price-asc" | "price-desc" | "name";
export type Availability = "in-stock" | "out-of-stock" | "unavailable";

export type CardProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: string;
  unitCode: string;
  categoryName: string;
  availability: Availability;
};

export type ListParams = {
  q?: string;
  category?: string;
  sort: SortKey;
  inStock: boolean;
  minPrice?: string;
  maxPrice?: string;
  page: number;
};

const visible: Prisma.ProductWhereInput = {
  publicationStatus: "PUBLISHED",
  category: { isActive: true },
};

function availabilityOf(isAvailableForSale: boolean, qty: unknown): Availability {
  if (!isAvailableForSale) return "unavailable";
  return Number(qty ?? 0) > 0 ? "in-stock" : "out-of-stock";
}

const cardSelect = {
  id: true,
  name: true,
  slug: true,
  sku: true,
  price: true,
  unitCode: true,
  isAvailableForSale: true,
  category: { select: { name: true } },
  inventory: { select: { quantityOnHand: true } },
} satisfies Prisma.ProductSelect;

type CardRow = Prisma.ProductGetPayload<{ select: typeof cardSelect }>;

function toCard(p: CardRow): CardProduct {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    price: p.price.toString(),
    unitCode: p.unitCode,
    categoryName: p.category.name,
    availability: availabilityOf(p.isAvailableForSale, p.inventory?.quantityOnHand),
  };
}

export async function getActiveCategories() {
  return db.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true },
  });
}

export async function getFeaturedProducts(limit = 4): Promise<CardProduct[]> {
  const rows = await db.product.findMany({
    where: {
      ...visible,
      isAvailableForSale: true,
      inventory: { quantityOnHand: { gt: 0 } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: cardSelect,
  });
  return rows.map(toCard);
}

const PRICE_RE = /^\d{1,10}(\.\d{1,2})?$/;

export async function listProducts(params: ListParams) {
  const and: Prisma.ProductWhereInput[] = [visible];

  if (params.q) {
    and.push({
      OR: [
        { name: { contains: params.q, mode: "insensitive" } },
        { sku: { contains: params.q, mode: "insensitive" } },
        { description: { contains: params.q, mode: "insensitive" } },
        { specifications: { some: { value: { contains: params.q, mode: "insensitive" } } } },
      ],
    });
  }
  if (params.category) and.push({ category: { slug: params.category } });
  if (params.inStock) {
    and.push({
      isAvailableForSale: true,
      inventory: { quantityOnHand: { gt: 0 } },
    });
  }
  const price: Prisma.DecimalFilter = {};
  if (params.minPrice && PRICE_RE.test(params.minPrice)) price.gte = params.minPrice;
  if (params.maxPrice && PRICE_RE.test(params.maxPrice)) price.lte = params.maxPrice;
  if (price.gte !== undefined || price.lte !== undefined) and.push({ price });

  const where: Prisma.ProductWhereInput = { AND: and };

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    params.sort === "price-asc"
      ? { price: "asc" }
      : params.sort === "price-desc"
        ? { price: "desc" }
        : params.sort === "name"
          ? { name: "asc" }
          : { createdAt: "desc" };

  const [total, rows] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: [orderBy, { id: "asc" }],
      skip: (params.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: cardSelect,
    }),
  ]);

  return { total, products: rows.map(toCard) };
}

export async function getProductBySlug(slug: string) {
  const p = await db.product.findFirst({
    where: { slug, ...visible },
    include: {
      category: { select: { name: true, slug: true } },
      specifications: { orderBy: { sortOrder: "asc" } },
      inventory: { select: { quantityOnHand: true } },
    },
  });
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    description: p.description,
    price: p.price.toString(),
    unitCode: p.unitCode,
    category: p.category,
    specifications: p.specifications.map((s) => ({ name: s.name, value: s.value })),
    availability: availabilityOf(p.isAvailableForSale, p.inventory?.quantityOnHand),
  };
}