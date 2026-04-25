-- GaanBajna Database Schema
CREATE DATABASE IF NOT EXISTS gaanbajna;
USE gaanbajna;

-- USER TABLE
CREATE TABLE IF NOT EXISTS USER (
    u_id INT AUTO_INCREMENT PRIMARY KEY,
    unique_username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'singer', 'audience', 'organizer') NOT NULL,
    status ENUM('active', 'pending', 'rejected') DEFAULT 'active',
    profile_picture VARCHAR(255),
    mobile_banking_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- OTP TABLE
CREATE TABLE IF NOT EXISTS OTP (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ADMIN INVITATION TABLE
CREATE TABLE IF NOT EXISTS ADMIN_INVITATION (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    invited_by INT NOT NULL,
    email VARCHAR(100) NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invited_by) REFERENCES USER(u_id)
);

-- EVENT TABLE
CREATE TABLE IF NOT EXISTS EVENT (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    organizer_id INT NOT NULL,
    singer_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    poster VARCHAR(255),
    date DATE NOT NULL,
    time TIME NOT NULL,
    venue VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    fee DECIMAL(10,2) NOT NULL,
    status ENUM('pending','approved','live','ended','cancelled') DEFAULT 'pending',
    dynamic_pricing_enable BOOLEAN DEFAULT FALSE,
    tier1_price DECIMAL(10,2),
    tier1_quantity INT,
    tier2_price DECIMAL(10,2),
    tier2_quantity INT,
    tier3_price DECIMAL(10,2),
    tier3_quantity INT,
    custom_url VARCHAR(255),
    custom_url_status ENUM('none','pending','approved') DEFAULT 'none',
    launch BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organizer_id) REFERENCES USER(u_id),
    FOREIGN KEY (singer_id) REFERENCES USER(u_id)
);

-- BOOKING REQUEST TABLE (Organizer books Singer)
CREATE TABLE IF NOT EXISTS BOOKING_REQUEST (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    organizer_id INT NOT NULL,
    singer_id INT NOT NULL,
    date DATE NOT NULL,
    venue VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    status ENUM('pending','accepted','rejected') DEFAULT 'pending',
    payment_status ENUM('unpaid','paid') DEFAULT 'unpaid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organizer_id) REFERENCES USER(u_id),
    FOREIGN KEY (singer_id) REFERENCES USER(u_id)
);

-- SINGER PROFILE TABLE
CREATE TABLE IF NOT EXISTS SINGER_PROFILE (
    profile_id INT AUTO_INCREMENT PRIMARY KEY,
    singer_id INT UNIQUE NOT NULL,
    bio TEXT,
    fixed_fee DECIMAL(10,2) DEFAULT 0,
    availability ENUM('available','unavailable') DEFAULT 'available',
    genre VARCHAR(100),
    FOREIGN KEY (singer_id) REFERENCES USER(u_id)
);

-- TICKET TABLE
CREATE TABLE IF NOT EXISTS TICKET (
    ticket_id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    buyer_id INT NOT NULL,
    tier INT NOT NULL COMMENT '1, 2, or 3',
    price DECIMAL(10,2) NOT NULL,
    qr_code VARCHAR(255) UNIQUE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES EVENT(event_id),
    FOREIGN KEY (buyer_id) REFERENCES USER(u_id)
);

-- TICKET ORDER (cart/purchase batch)
CREATE TABLE IF NOT EXISTS TICKET_ORDER (
    t_order_id INT AUTO_INCREMENT PRIMARY KEY,
    buyer_id INT NOT NULL,
    event_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending','paid','failed') DEFAULT 'pending',
    ordered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES USER(u_id),
    FOREIGN KEY (event_id) REFERENCES EVENT(event_id)
);

-- QR_SCAN_LOG TABLE
CREATE TABLE IF NOT EXISTS QR_SCAN_LOG (
    scan_id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    device VARCHAR(100),
    result ENUM('valid','invalid','duplicate') NOT NULL,
    FOREIGN KEY (ticket_id) REFERENCES TICKET(ticket_id)
);

-- ITEM TABLE (Marketplace)
CREATE TABLE IF NOT EXISTS ITEM (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    seller_id INT NOT NULL,
    event_id INT,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    photo VARCHAR(255),
    qr_code VARCHAR(255),
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES USER(u_id),
    FOREIGN KEY (event_id) REFERENCES EVENT(event_id)
);

-- BROWSING HISTORY (for recommendations)
CREATE TABLE IF NOT EXISTS BROWSING_HISTORY (
    id INT AUTO_INCREMENT PRIMARY KEY,
    u_id INT NOT NULL,
    item_id INT,
    event_id INT,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (u_id) REFERENCES USER(u_id),
    FOREIGN KEY (item_id) REFERENCES ITEM(item_id),
    FOREIGN KEY (event_id) REFERENCES EVENT(event_id)
);

-- ORDER TABLE (Marketplace orders)
CREATE TABLE IF NOT EXISTS `ORDER` (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    buyer_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    shipping_amount DECIMAL(10,2) DEFAULT 0,
    shipping_name VARCHAR(100) NOT NULL,
    shipping_address TEXT NOT NULL,
    shipping_phone VARCHAR(20) NOT NULL,
    status ENUM('pending','paid','shipped','delivered','cancelled') DEFAULT 'pending',
    order_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES USER(u_id)
);

-- ORDER_ITEM TABLE
CREATE TABLE IF NOT EXISTS ORDER_ITEM (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES `ORDER`(order_id),
    FOREIGN KEY (item_id) REFERENCES ITEM(item_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- COMPLAINT TABLE  (replaces old Complaint table)
-- buyer_id  = the audience member who submits
-- media     = JSON array of { type, url, name, size } objects
-- status    = workflow: pending → reviewed → resolved / dismissed
-- admin_note= admin's internal note when resolving/dismissing
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `COMPLAINT` (
    complaint_id  INT AUTO_INCREMENT PRIMARY KEY,
    event_id      INT          NOT NULL,
    buyer_id      INT          NOT NULL,
    text_content  TEXT,
    media         JSON,                          -- array of file objects
    status        ENUM('pending','reviewed','resolved','dismissed') NOT NULL DEFAULT 'pending',
    admin_note    TEXT,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id)  REFERENCES EVENT(event_id) ON DELETE CASCADE,
    FOREIGN KEY (buyer_id)  REFERENCES USER(u_id)      ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────────────────────────────────
-- EVENT_COMPLAINT_QR TABLE
-- Each organizer can generate ONE complaint-QR per event.
-- When an audience member scans it they land on /complaint-form?token=<token>
-- token     = unique UUID, never changes per event
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS EVENT_COMPLAINT_QR (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    event_id    INT          NOT NULL UNIQUE,    -- one QR per event
    token       VARCHAR(255) NOT NULL UNIQUE,    -- UUID used in the public URL
    qr_image    TEXT,                            -- base64 PNG of the QR code
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES EVENT(event_id) ON DELETE CASCADE
);

-- CART TABLE
CREATE TABLE IF NOT EXISTS CART (
    cart_id INT AUTO_INCREMENT PRIMARY KEY,
    u_id INT NOT NULL,
    item_id INT,
    ticket_event_id INT,
    ticket_tier INT,
    quantity INT DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (u_id) REFERENCES USER(u_id),
    FOREIGN KEY (item_id) REFERENCES ITEM(item_id),
    FOREIGN KEY (ticket_event_id) REFERENCES EVENT(event_id)
);
