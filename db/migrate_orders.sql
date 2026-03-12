-- Run once: adds shipping columns to ORDER table
-- mysql -u root -pGaanBajna@2024 gaanbajna < ~/Desktop/MERN/GaanBajna/db/migrate_orders.sql
USE gaanbajna;

ALTER TABLE `ORDER`
  ADD COLUMN transaction_id   VARCHAR(100) NULL AFTER status;

ALTER TABLE `ORDER`
  ADD COLUMN shipping_name    VARCHAR(120) NULL AFTER transaction_id;

ALTER TABLE `ORDER`
  ADD COLUMN shipping_phone   VARCHAR(20)  NULL AFTER shipping_name;

ALTER TABLE `ORDER`
  ADD COLUMN shipping_address TEXT         NULL AFTER shipping_phone;

ALTER TABLE `ORDER`
  ADD COLUMN shipping_note    TEXT         NULL AFTER shipping_address;

SELECT 'Orders migration complete ✅' AS result;
