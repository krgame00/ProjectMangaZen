const th = {
  // Navbar
  nav_search_placeholder: "ค้นหามังงะ...",
  nav_upload: "อัพโหลด",
  nav_lang_th: "🇹🇭 ไทย",
  nav_lang_en: "🇬🇧 EN",

  // Search Page
  search_title: "ผลการค้นหา",
  search_for: "สำหรับ",
  search_results_count: "พบ",
  search_results_unit: "เรื่อง",
  search_empty: "ไม่พบมังงะที่ตรงกับคำค้นหา",
  search_empty_hint: "ลองใช้คำค้นหาอื่น หรือตรวจสอบการสะกด",
  search_back: "← กลับหน้าหลัก",

  // Sidebar
  sb_menu: "เมนู",
  sb_home: "หน้าหลัก",
  sb_favorites: "รายการโปรด",
  sb_history: "ประวัติ",
  sb_random: "สุ่มเรื่อง",
  sb_user: "ผู้ใช้งาน",
  sb_login: "เข้าสู่ระบบ",

  // Home Page / Banner
  hero_title_prefix: "ยินดีต้อนรับสู่",
  hero_desc: "อ่านมังงะออนไลน์ฟรี รองรับ JPG · PNG · WebP · PDF พร้อมแปลภาษาด้วย AI ✨",
  hero_stat_manga: "มังงะ",
  hero_stat_pages: "หน้า",
  hero_stat_categories: "หมวดหมู่",
  db_bar: "ระบบพร้อมใช้งานแล้ว ข้อมูลจะถูกจัดเก็บและซิงค์ด้วยฐานข้อมูล Prisma",

  // Category chips
  cat_all: "ทั้งหมด",
  cat_action: "แอ็กชัน",
  cat_romance: "โรแมนซ์",
  cat_comedy: "คอมเมดี้",
  cat_fantasy: "แฟนตาซี",
  cat_horror: "สยองขวัญ",
  cat_scifi: "ไซไฟ",
  cat_label: "หมวดหมู่",

  // Manga list
  manga_all_title: "มังงะทั้งหมด",
  manga_cat_prefix: "มังงะหมวดหมู่:",
  manga_empty_all: "ไม่มีข้อมูลมังงะ กรุณาอัพโหลดมังงะเรื่องใหม่!",
  manga_empty_cat: "ยังไม่มีมังงะในหมวดหมู่นี้",

  // Sort
  sort_newest: "📅 ล่าสุด (ใหม่ไปเก่า)",
  sort_oldest: "⏳ อดีต (เก่าไปใหม่)",
  sort_title_asc: "🔤 ชื่อเรื่อง (A-Z, ก-ฮ)",
  sort_title_desc: "🔠 ชื่อเรื่อง (Z-A, ฮ-ก)",

  // Upload Modal
  upload_title: "📤 อัพโหลดมังงะ",
  upload_manga_title: "ชื่อมังงะ *",
  upload_manga_title_ph: "ชื่อเรื่อง...",
  upload_author: "ผู้แต่ง",
  upload_author_ph: "ชื่อผู้แต่ง...",
  upload_desc: "คำอธิบาย",
  upload_desc_ph: "เรื่องย่อ...",
  upload_genre: "หมวดหมู่ *",
  upload_status: "สถานะ",
  upload_status_ongoing: "กำลังออก",
  upload_status_completed: "จบแล้ว",
  upload_tags: "แท็ก (กด Enter เพิ่ม)",
  upload_tags_ph: "เพิ่มแท็ก...",
  upload_files_label: "ไฟล์หน้ามังงะ — รูปภาพ (JPG/PNG/WebP) หรือ PDF",
  upload_btn_cancel: "ยกเลิก",
  upload_btn_submit: "อัพโหลด",
  upload_btn_uploading: "กำลังอัพโหลด...",
  upload_converting: "กำลังแปลง PDF...",
};

export default th;
export type Translations = typeof th;
