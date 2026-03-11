// ============================================================
//  GaanBajna — seed.js  (with posters + product photos)
//  cd ~/Desktop/MERN/GaanBajna/backend
//  node seed.js
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

// Free, stable image URLs for demo use
const POSTERS = {
  fiesta:      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80',
  eid:         'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&q=80',
  rock:        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80',
  friendship:  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80',
  acoustic:    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80',
};

const PHOTOS = {
  poster:      'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=400&q=80',
  cd:          'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&q=80',
  tshirt:      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80',
  tote:        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80',
  autograph:   'https://images.unsplash.com/photo-1598387993281-cecf8b71a8f8?w=400&q=80',
  usb:         'https://images.unsplash.com/photo-1625948515591-29e55e0e4737?w=400&q=80',
  vinyl:       'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=400&q=80',
  wristband:   'https://images.unsplash.com/photo-1617870952348-7524edfb61b7?w=400&q=80',
  guitar_pick: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&q=80',
  live_cd:     'https://images.unsplash.com/photo-1598387993211-5c3c463d6c3c?w=400&q=80',
  hoodie:      'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=400&q=80',
  lanyard:     'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&q=80',
  frame:       'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&q=80',
  photo_print: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&q=80',
};

async function seed() {
  const conn = await pool.getConnection();
  console.log('✅ Connected to MySQL database:', process.env.DB_NAME);

  try {
    await conn.beginTransaction();

    // --------------------------------------------------------
    // 1. CLEAR OLD DATA
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

    const [users] = await conn.query('SELECT u_id, email FROM USER ORDER BY u_id');
    const uid = {};
    users.forEach(u => { uid[u.email] = u.u_id; });
    console.log('   User IDs:', JSON.stringify(uid));

    // --------------------------------------------------------
    // 3. SINGER PROFILES (with profile pictures)
    // --------------------------------------------------------
    console.log('🎤 Inserting singer profiles...');
    await conn.query(`
      INSERT INTO SINGER_PROFILE (singer_id, bio, fixed_fee, availability, genre) VALUES
      (?, 'Award-winning Bangladeshi folk-fusion artist with 15+ years on stage. Known for soulful melodies and powerful performances.', 50000, 'available', 'Folk / Fusion'),
      (?, 'Pop sensation loved across Bangladesh. Nancy brings emotion and energy to every single performance she delivers on stage.', 40000, 'available', 'Pop'),
      (?, 'Chart-topping modern Bangla pop artist. Imran has won millions of hearts with his romantic voice and charismatic stage presence.', 45000, 'available', 'Pop / R&B'),
      (?, 'Queen of Bangla indie music. Kona voice is instantly recognizable and her live shows are an unforgettable experience.', 38000, 'available', 'Indie / Soul'),
      (?, 'Legendary fusion maestro blending Rabindra sangeet with jazz. Habib Wahid redefines Bangladeshi music at every concert.', 60000, 'available', 'Fusion / Jazz')
    `, [
      uid['arif@gaanbajna.com'],
      uid['nancy@gaanbajna.com'],
      uid['imran@gaanbajna.com'],
      uid['kona@gaanbajna.com'],
      uid['habib@gaanbajna.com'],
    ]);

    // Update singer profile pictures
    await conn.query(`UPDATE USER SET profile_picture=? WHERE u_id=?`, ['https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&q=80', uid['arif@gaanbajna.com']]);
    await conn.query(`UPDATE USER SET profile_picture=? WHERE u_id=?`, ['https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&q=80', uid['nancy@gaanbajna.com']]);
    await conn.query(`UPDATE USER SET profile_picture=? WHERE u_id=?`, ['https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80', uid['imran@gaanbajna.com']]);
    await conn.query(`UPDATE USER SET profile_picture=? WHERE u_id=?`, ['https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300&q=80', uid['kona@gaanbajna.com']]);
    await conn.query(`UPDATE USER SET profile_picture=? WHERE u_id=?`, ['https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=300&q=80', uid['habib@gaanbajna.com']]);

    // --------------------------------------------------------
    // 4. EVENTS (with poster URLs)
    // --------------------------------------------------------
    console.log('🎵 Inserting events...');
    await conn.query(`
      INSERT INTO EVENT
        (organizer_id, singer_id, title, description, poster, date, time, venue, city,
         fee, status, launch, dynamic_pricing_enable,
         tier1_price, tier1_quantity,
         tier2_price, tier2_quantity,
         tier3_price, tier3_quantity,
         custom_url, custom_url_status)
      VALUES
      (?, ?, 'Dhaka Music Fiesta 2025',
       'The biggest open-air music festival in Dhaka. Two stages, amazing food stalls, and non-stop music from 4 PM till midnight. Featuring Arif Alvi and surprise guests.',
       ?, '2025-12-20', '16:00:00', 'Bashundhara City Convention Hall', 'Dhaka',
       50000, 'live', 1, 0, 500, 600, 1200, 300, 2500, 100, 'dhaka-music-fiesta-2025', 'none'),

      (?, ?, 'Eid Special Night Concert',
       'Celebrate Eid ul-Adha with a magical evening of music. Habib Wahid takes the stage for a night of fusion, joy, and unforgettable memories with family and friends.',
       ?, '2025-06-07', '19:00:00', 'Army Stadium', 'Dhaka',
       60000, 'live', 1, 0, 800, 1200, 1800, 600, 3500, 200, 'eid-special-night', 'none'),

      (?, ?, 'Bangla Rock Night',
       'A high-energy rock night showcasing the very best of Bangladeshi music. Imran brings his signature pop-rock style. Expect pyrotechnics, lasers, and an electrifying crowd.',
       ?, '2025-11-15', '18:00:00', 'International Convention City Bashundhara', 'Dhaka',
       45000, 'live', 1, 1, 600, 500, 1500, 200, 3000, 100, 'bangla-rock-night', 'none'),

      (?, ?, 'Kolkata-Dhaka Friendship Concert',
       'A landmark cross-border musical celebration bringing together artists from Kolkata and Dhaka on one historic stage. Kona headlines this once-in-a-year cultural event.',
       ?, '2025-10-10', '17:00:00', 'Bangladesh National Museum Auditorium', 'Dhaka',
       38000, 'live', 1, 0, 700, 300, 1600, 150, 3200, 50, 'kolkata-dhaka-friendship', 'none'),

      (?, ?, 'Acoustic Evenings Vol. 3',
       'An intimate unplugged session with Nancy in a beautifully lit cozy venue. Perfect for those who love raw, heartfelt music. Limited seats — book early to avoid disappointment.',
       ?, '2025-09-05', '18:30:00', 'The Daily Star Centre', 'Dhaka',
       38000, 'live', 1, 0, 400, 200, 900, 80, 1800, 20, 'acoustic-evenings-vol-3', 'none')
    `, [
      uid['soundwave@gaanbajna.com'], uid['arif@gaanbajna.com'],  POSTERS.fiesta,
      uid['soundwave@gaanbajna.com'], uid['habib@gaanbajna.com'], POSTERS.eid,
      uid['dhakalive@gaanbajna.com'], uid['imran@gaanbajna.com'], POSTERS.rock,
      uid['dhakalive@gaanbajna.com'], uid['kona@gaanbajna.com'],  POSTERS.friendship,
      uid['soundwave@gaanbajna.com'], uid['nancy@gaanbajna.com'], POSTERS.acoustic,
    ]);

    // --------------------------------------------------------
    // 5. MARKETPLACE ITEMS (with photos + descriptions)
    // --------------------------------------------------------
    console.log('🛍️  Inserting marketplace items...');
    await conn.query(`
      INSERT INTO ITEM (seller_id, name, type, description, price, stock_quantity, photo) VALUES
      (?, 'Arif Alvi Signed Poster',        'Merchandise', 'Limited edition A2 glossy concert poster, personally hand-signed by Arif Alvi after his sold-out Dhaka show. Comes in a protective sleeve. Perfect wall art for any music lover.',  850,  50, ?),
      (?, 'Folk Fusion Acoustic CD',         'Music',       'Arif Alvi latest studio album "Mati O Sur" — physical CD with a 16-page exclusive photo booklet. Recorded live at EMI Dhaka studios with a full acoustic ensemble.',              499, 100, ?),
      (?, 'Nancy Concert T-Shirt',           'Apparel',     'Premium 100% cotton T-shirt featuring Nancy signature Eid Concert 2025 artwork printed with fade-resistant ink. Available in sizes S, M, L, XL, and XXL.',                         699, 200, ?),
      (?, 'Nancy Tote Bag',                  'Merchandise', 'Eco-friendly heavy-duty canvas tote bag featuring Nancy iconic logo and tour dates printed on both sides. Great for shopping, college, or everyday use.',                            350, 150, ?),
      (?, 'Imran Autographed Album Cover',   'Merchandise', 'Officially licensed printed album cover of the chart-topping "Valobasha Korbo", personally autographed by Imran. Each piece comes with a certificate of authenticity.',             600,  75, ?),
      (?, 'Pop Hits Collection USB',         'Music',       'All of Imran greatest pop hits — over 40 tracks — pre-loaded on a sleek branded USB drive. High quality 320kbps audio. Just plug in and enjoy.',                                  799,  60, ?),
      (?, 'Kona Indie Vinyl Record',         'Music',       'Ultra-limited run 180g vinyl of Kona debut indie album "Nil Akash". Only 30 copies pressed worldwide. Includes a hand-numbered insert signed by Kona herself.',                   1200,  30, ?),
      (?, 'Kona Wristband Set',              'Merchandise', 'Set of 3 premium silicone wristbands in gold, black and white — official merchandise from the Acoustic Evenings Vol. 3 tour. Adjustable fit for all wrist sizes.',                  199, 300, ?),
      (?, 'Habib Wahid Guitar Pick Set',     'Merchandise', 'Collector pack of 10 custom celluloid guitar picks in various thicknesses — all personally used and signed by Habib Wahid during his live jazz fusion performances.',              450,  80, ?),
      (?, 'Jazz Fusion Live CD',             'Music',       'Official live recording of Habib Wahid landmark sold-out Kolkata-Dhaka Friendship Concert. Crystal clear audio mastered by Emon Khan. Two-disc set with concert photos.',          550, 120, ?),
      (?, 'GaanBajna Festival Hoodie',       'Apparel',     'Official GaanBajna Music Fiesta 2025 festival hoodie. Made from premium 380gsm fleece with embroidered logo on chest. Unisex sizing, available S to XXL.',                       1500, 100, ?),
      (?, 'VIP Lanyard and Wristband Combo', 'Merchandise', 'Authentic VIP access lanyard and holographic wristband from Dhaka Music Fiesta 2025. A rare collectible for true GaanBajna fans. Only 200 sets available.',                       299, 200, ?),
      (?, 'Bangla Rock Night Poster Framed', 'Merchandise', 'Official limited edition Bangla Rock Night 2025 gig poster (A1 size) in a handcrafted solid wood frame with UV-protective glass. Ready to hang straight out of the box.',         1800,  25, ?),
      (?, 'Concert Photography Print Pack',  'Photography', 'Stunning set of 5 professionally shot 8x10 inch glossy prints from Dhaka Live best concert moments. Each print is individually signed by photographer Rafi Ahmed.',               999,  40, ?)
    `, [
      uid['arif@gaanbajna.com'],        PHOTOS.poster,
      uid['arif@gaanbajna.com'],        PHOTOS.cd,
      uid['nancy@gaanbajna.com'],       PHOTOS.tshirt,
      uid['nancy@gaanbajna.com'],       PHOTOS.tote,
      uid['imran@gaanbajna.com'],       PHOTOS.autograph,
      uid['imran@gaanbajna.com'],       PHOTOS.usb,
      uid['kona@gaanbajna.com'],        PHOTOS.vinyl,
      uid['kona@gaanbajna.com'],        PHOTOS.wristband,
      uid['habib@gaanbajna.com'],       PHOTOS.guitar_pick,
      uid['habib@gaanbajna.com'],       PHOTOS.live_cd,
      uid['soundwave@gaanbajna.com'],   PHOTOS.hoodie,
      uid['soundwave@gaanbajna.com'],   PHOTOS.lanyard,
      uid['dhakalive@gaanbajna.com'],   PHOTOS.frame,
      uid['dhakalive@gaanbajna.com'],   PHOTOS.photo_print,
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
