DO $$ BEGIN CREATE TYPE "ReturnStatus" AS ENUM ('requested', 'approved', 'rejected', 'refunded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'refunded';
CREATE TABLE IF NOT EXISTS return_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  user_id UUID NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL,
  status "ReturnStatus" NOT NULL DEFAULT 'requested',
  admin_note TEXT,
  refund_amount DECIMAL(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS return_requests_order_id_idx ON return_requests(order_id);
CREATE INDEX IF NOT EXISTS return_requests_status_created_idx ON return_requests(status, created_at);
CREATE TABLE IF NOT EXISTS stock_opnames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  system_stock INT NOT NULL,
  physical_stock INT NOT NULL,
  difference INT NOT NULL,
  note TEXT,
  created_by VARCHAR(36),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS stock_opnames_product_created_idx ON stock_opnames(product_id, created_at);
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(220) NOT NULL UNIQUE,
  excerpt VARCHAR(500),
  content TEXT NOT NULL,
  cover_url TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS articles_published_created_idx ON articles(published, created_at);
