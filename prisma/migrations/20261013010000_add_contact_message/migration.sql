-- Pesan dari contact form publik untuk ditampilkan di kotak masuk admin (/admin/contact).
-- Tabel baru: CREATE IF NOT EXISTS + CREATE INDEX IF NOT EXISTS supaya aman dijalankan ulang.
CREATE TABLE IF NOT EXISTS "contact_messages" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "topic" VARCHAR(30) NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'unread',
    "email_sent" BOOLEAN NOT NULL DEFAULT false,
    "email_error" TEXT,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "contact_messages_status_created_at_idx" ON "contact_messages"("status", "created_at");
