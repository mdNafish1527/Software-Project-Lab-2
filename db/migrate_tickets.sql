-- Fixed migration — compatible with all MySQL versions
USE gaanbajna;

ALTER TABLE TICKET
  ADD COLUMN ticket_code VARCHAR(60) NULL AFTER qr_code;

ALTER TABLE TICKET
  ADD COLUMN order_id INT NULL AFTER ticket_code;

ALTER TABLE TICKET
  ADD COLUMN transaction_id VARCHAR(100) NULL AFTER order_id;

ALTER TABLE TICKET_ORDER
  ADD COLUMN transaction_id VARCHAR(100) NULL AFTER status;

SELECT 'Migration complete ✅' AS result;
