-- Add `color` column to categories (Odoo-style category color picker)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS color VARCHAR(7);
