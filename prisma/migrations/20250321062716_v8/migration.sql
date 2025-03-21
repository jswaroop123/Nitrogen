-- AlterTable
CREATE SEQUENCE order_id_seq;
ALTER TABLE "Order" ALTER COLUMN "id" SET DEFAULT nextval('order_id_seq');
ALTER SEQUENCE order_id_seq OWNED BY "Order"."id";

-- AlterTable
CREATE SEQUENCE orderitem_id_seq;
ALTER TABLE "OrderItem" ALTER COLUMN "id" SET DEFAULT nextval('orderitem_id_seq');
ALTER SEQUENCE orderitem_id_seq OWNED BY "OrderItem"."id";
