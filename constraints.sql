-- Add as a second migration after the initial one (see README).
ALTER TABLE "Inventory" ADD CONSTRAINT "inventory_quantity_nonnegative" CHECK ("quantityOnHand" >= 0);
ALTER TABLE "Product" ADD CONSTRAINT "product_price_nonnegative" CHECK ("price" >= 0);
ALTER TABLE "OrderItem" ADD CONSTRAINT "order_item_quantity_positive" CHECK ("quantity" > 0);
ALTER TABLE "OrderItem" ADD CONSTRAINT "order_item_price_nonnegative" CHECK ("unitPrice" >= 0);
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "inventory_movement_balance"
  CHECK ("quantityAfter" = "quantityBefore" + "quantityChange");
CREATE UNIQUE INDEX "one_primary_image_per_product" ON "ProductImage" ("productId") WHERE "isPrimary" = true;
ALTER TABLE "Order" ADD CONSTRAINT "order_fulfillment_pricing" CHECK (
  ("fulfillmentMethod" = 'PICKUP' AND "deliveryAddress" IS NULL AND "deliveryFee" = 0 AND "total" = "subtotal")
  OR
  ("fulfillmentMethod" = 'DELIVERY' AND "deliveryAddress" IS NOT NULL AND (
     ("deliveryFee" IS NULL AND "total" IS NULL)
     OR ("deliveryFee" >= 0 AND "total" = "subtotal" + "deliveryFee")))
);
