// ============================================================
//  GaanBajna — seed.js  (corrected with real schema)
//  Run from backend folder:
//    cd ~/Desktop/MERN/GaanBajna/backend
//    node seed.js
// ============================================================

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gaanbajna',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function seed() {
  const conn = await pool.getConnection();
  console.log('✅ Connected to MySQL database:', process.env.DB_NAME);

  try {
    await conn.beginTransaction();

    // --------------------------------------------------------
    // 1. CLEAR OLD SEED DATA
    // --------------------------------------------------------
    console.log('🧹 Clearing old seed data...');
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    await conn.query('DELETE FROM ITEM');
    await conn.query('DELETE FROM TICKET');
    await conn.query('DELETE FROM BOOKING_REQUEST');
    await conn.query('DELETE FROM EVENT');
    await conn.query('DELETE FROM SINGER_PROFILE');
    await conn.query('DELETE FROM USER');
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    // --------------------------------------------------------
    // 2. USERS
    //    status enum: 'active' | 'pending' | 'rejected'
    //    password hash = bcrypt of "Password123!"
    // --------------------------------------------------------
    console.log('👤 Inserting users...');
    await conn.query(`
      INSERT INTO USER (unique_username, email, password, role, status) VALUES
      ('admin_gaanbajna',  'admin@gaanbajna.com',     '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'admin',     'active'),
      ('arif_alvi',        'arif@gaanbajna.com',      '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'singer',    'active'),
      ('nancy_singer',     'nancy@gaanbajna.com',     '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'singer',    'active'),
      ('imran_singer',     'imran@gaanbajna.com',     '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'singer',    'active'),
      ('kona_singer',      'kona@gaanbajna.com',      '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'singer',    'active'),
      ('habib_wahid',      'habib@gaanbajna.com',     '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'singer',    'active'),
      ('soundwave_events', 'soundwave@gaanbajna.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'organizer', 'active'),
      ('dhaka_live',       'dhakalive@gaanbajna.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'organizer', 'active'),
      ('rahim_hossain',    'rahim@example.com',       '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'audience',  'active'),
      ('sumaiya_akter',    'sumaiya@example.com',     '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'audience',  'active')
    `);

    // Get IDs dynamically
    const [users] = await conn.query('SELECT u_id, email, role FROM USER ORDER BY u_id');
    const uid = {};
    users.forEach(u => { uid[u.email] = u.u_id; });
    console.log('   Inserted user IDs:', JSON.stringify(uid));

    // --------------------------------------------------------
    // 3. SINGER PROFILES
    //    availability: 'available' | 'unavailable'
    // --------------------------------------------------------
    console.log('🎤 Inserting singer profiles...');
    await conn.query(`
      INSERT INTO SINGER_PROFILE (singer_id, bio, fixed_fee, availability, genre) VALUES
      (?, 'Award-winning Bangladeshi folk-fusion artist with 15+ years on stage.', 50000, 'available', 'Folk / Fusion'),
      (?, 'Pop sensation known for soulful ballads and high-energy live shows.',   40000, 'available', 'Pop'),
      (?, 'Chart-topping modern Bangla pop artist loved by millions.',             45000, 'available', 'Pop / R&B'),
      (?, 'Queen of Bangla indie — her voice is unmistakable.',                    38000, 'available', 'Indie / Soul'),
      (?, 'Legendary fusion maestro blending Rabindra sangeet with jazz.',         60000, 'available', 'Fusion / Jazz')
    `, [
      uid['arif@gaanbajna.com'],
      uid['nancy@gaanbajna.com'],
      uid['imran@gaanbajna.com'],
      uid['kona@gaanbajna.com'],
      uid['habib@gaanbajna.com'],
    ]);

    // --------------------------------------------------------
    // 4. EVENTS
    //    status = 'live'  → shows on /concerts page
    //    launch = 1       → publicly visible
    // --------------------------------------------------------
    console.log('🎵 Inserting events...');
    await conn.query(`
      INSERT INTO EVENT
        (organizer_id, singer_id, title, description, date, time, venue, city,
         fee, status, launch, dynamic_pricing_enable,
         tier1_price, tier1_quantity,
         tier2_price, tier2_quantity,
         tier3_price, tier3_quantity,
         custom_url, custom_url_status)
      VALUES
      (?, ?,
       'Dhaka Music Fiesta 2025',
       'The biggest open-air music festival in Dhaka. Two stages, food stalls, and non-stop music from 4 PM.',
       '2025-12-20', '16:00:00', 'Bashundhara City Convention Hall', 'Dhaka',
       50000, 'live', 1, 0,
       500, 600, 1200, 300, 2500, 100,
       'dhaka-music-fiesta-2025', 'none'),

      (?, ?,
       'Eid Special Night Concert',
       'Celebrate Eid with a magical evening of music featuring Habib Wahid and special guests.',
       '2025-04-01', '19:00:00', 'Army Stadium', 'Dhaka',
       60000, 'live', 1, 0,
       800, 1200, 1800, 600, 3500, 200,
       'eid-special-night', 'none'),

      (?, ?,
       'Bangla Rock Night',
       'A high-energy rock night showcasing the best of Bangladeshi music. Expect an unforgettable night.',
       '2025-11-15', '18:00:00', 'International Convention City Bashundhara', 'Dhaka',
       45000, 'live', 1, 1,
       600, 500, 1500, 200, 3000, 100,
       'bangla-rock-night', 'none'),

      (?, ?,
       'Kolkata-Dhaka Friendship Concert',
       'A cross-border musical celebration bringing together artists from Kolkata and Dhaka.',
       '2025-10-10', '17:00:00', 'Bangladesh National Museum Auditorium', 'Dhaka',
       38000, 'live', 1, 0,
       700, 300, 1600, 150, 3200, 50,
       'kolkata-dhaka-friendship', 'none'),

      (?, ?,
       'Acoustic Evenings Vol. 3',
       'An intimate acoustic session — perfect for music lovers who appreciate raw unplugged performances.',
       '2025-09-05', '18:30:00', 'The Daily Star Centre', 'Dhaka',
       38000, 'live', 1, 0,
       400, 200, 900, 80, 1800, 20,
       'acoustic-evenings-vol-3', 'none')
    `, [
      uid['soundwave@gaanbajna.com'], uid['arif@gaanbajna.com'],
      uid['soundwave@gaanbajna.com'], uid['habib@gaanbajna.com'],
      uid['dhakalive@gaanbajna.com'], uid['imran@gaanbajna.com'],
      uid['dhakalive@gaanbajna.com'], uid['kona@gaanbajna.com'],
      uid['soundwave@gaanbajna.com'], uid['nancy@gaanbajna.com'],
    ]);

    // --------------------------------------------------------
    // 5. MARKETPLACE ITEMS (ITEM table)
    // --------------------------------------------------------
    console.log('🛍️  Inserting marketplace items...');
    await conn.query(`
      INSERT INTO ITEM (seller_id, name, type, description, price, stock_quantity) VALUES
      (?, 'Arif Alvi Signed Poster',        'Merchandise', 'Limited edition A2 concert poster hand-signed by Arif Alvi.',            850,  50),
      (?, 'Folk Fusion Acoustic CD',         'Music',       'Arif Alvi latest studio album Mati O Sur with exclusive booklet.',        499, 100),
      (?, 'Nancy Concert T-Shirt',           'Apparel',     'Premium cotton T-shirt with Nancy Eid Concert 2025 artwork. Sizes S-XXL.',699, 200),
      (?, 'Nancy Tote Bag',                  'Merchandise', 'Eco-friendly canvas tote bag with Nancy iconic logo print.',               350, 150),
      (?, 'Imran Autographed Album Cover',   'Merchandise', 'Album cover of Valobasha Korbo autographed by Imran himself.',            600,  75),
      (?, 'Pop Hits Collection USB',         'Music',       'All of Imran hit tracks on a branded USB drive. Plug and play!',          799,  60),
      (?, 'Kona Indie Vinyl Record',         'Music',       'Limited run vinyl of Kona debut album Nil Akash collectors edition.',    1200,  30),
      (?, 'Kona Wristband Set',              'Merchandise', 'Set of 3 silicone wristbands from the Acoustic Evenings tour.',           199, 300),
      (?, 'Habib Wahid Guitar Pick Set',     'Merchandise', 'Pack of 10 custom guitar picks signed by Habib Wahid during live shows.', 450,  80),
      (?, 'Jazz Fusion Live CD',             'Music',       'Live recording of Habib Wahid sold-out Friendship Concert performance.',   550, 120),
      (?, 'GaanBajna Festival Hoodie',       'Apparel',     'Official GaanBajna 2025 festival hoodie. Thick fleece, unisex sizing.',  1500, 100),
      (?, 'VIP Lanyard and Wristband Combo', 'Merchandise', 'Genuine VIP lanyard and wristband from Dhaka Music Fiesta 2025.',         299, 200),
      (?, 'Bangla Rock Night Poster Framed', 'Merchandise', 'Official Bangla Rock Night 2025 poster in a premium wooden frame.',       1800,  25),
      (?, 'Concert Photography Print Pack',  'Photography', 'Set of 5 high-quality 8x10 prints from Dhaka Live best concert moments.', 999,  40)
    `, [
      uid['arif@gaanbajna.com'],
      uid['arif@gaanbajna.com'],
      uid['nancy@gaanbajna.com'],
      uid['nancy@gaanbajna.com'],
      uid['imran@gaanbajna.com'],
      uid['imran@gaanbajna.com'],
      uid['kona@gaanbajna.com'],
      uid['kona@gaanbajna.com'],
      uid['habib@gaanbajna.com'],
      uid['habib@gaanbajna.com'],
      uid['soundwave@gaanbajna.com'],
      uid['soundwave@gaanbajna.com'],
      uid['dhakalive@gaanbajna.com'],
      uid['dhakalive@gaanbajna.com'],
    ]);

    await conn.commit();

    // --------------------------------------------------------
    // SUMMARY
    // --------------------------------------------------------
    const [[{ userCount }]]   = await conn.query('SELECT COUNT(*) as userCount FROM USER');
    const [[{ eventCount }]]  = await conn.query('SELECT COUNT(*) as eventCount FROM EVENT');
    const [[{ itemCount }]]   = await conn.query('SELECT COUNT(*) as itemCount FROM ITEM');
    const [[{ singerCount }]] = await conn.query('SELECT COUNT(*) as singerCount FROM SINGER_PROFILE');

    console.log('\n🎉 Seed complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`👤 Users inserted:       ${userCount}`);
    console.log(`🎤 Singer profiles:      ${singerCount}`);
    console.log(`🎵 Events (all live):    ${eventCount}`);
    console.log(`🛍️  Marketplace items:  ${itemCount}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🔑 Login password for ALL accounts: Password123!');
    console.log('   admin@gaanbajna.com      → Admin');
    console.log('   arif@gaanbajna.com       → Singer');
    console.log('   soundwave@gaanbajna.com  → Organizer');
    console.log('   rahim@example.com        → Audience\n');

  } catch (err) {
    await conn.rollback();
    console.error('\n❌ Seed failed! Rolling back...');
    console.error('Error:', err.message);
    console.error('\nFull error:', err);
  } finally {
    conn.release();
    process.exit(0);
  }
}

seed();
