import type { Translations } from "./th";

const en: Translations = {
  // Navbar
  nav_search_placeholder: "Search manga...",
  nav_upload: "Upload",
  nav_lang_th: "🇹🇭 Thai",
  nav_lang_en: "🇬🇧 EN",

  // Search Page
  search_title: "Search Results",
  search_for: "for",
  search_results_count: "Found",
  search_results_unit: "result(s)",
  search_empty: "No manga matched your search",
  search_empty_hint: "Try different keywords or check spelling",
  search_back: "← Back to Home",

  // Sidebar
  sb_menu: "Menu",
  sb_home: "Home",
  sb_favorites: "Favorites",
  sb_history: "History",
  sb_random: "Random",
  sb_user: "Account",
  sb_login: "Sign In",

  // Home Page / Banner
  hero_title_prefix: "Welcome to",
  hero_desc: "Read manga online for free. Supports JPG · PNG · WebP · PDF with AI translation ✨",
  hero_stat_manga: "Manga",
  hero_stat_pages: "Pages",
  hero_stat_categories: "Categories",
  db_bar: "System ready. Data is stored and synced via Prisma database.",

  // Category chips
  cat_all: "All",
  cat_action: "Action",
  cat_romance: "Romance",
  cat_comedy: "Comedy",
  cat_fantasy: "Fantasy",
  cat_horror: "Horror",
  cat_scifi: "Sci-Fi",
  cat_label: "Categories",

  // Manga list
  manga_all_title: "All Manga",
  manga_cat_prefix: "Category:",
  manga_empty_all: "No manga found. Please upload a new title!",
  manga_empty_cat: "No manga in this category yet.",

  // Sort
  sort_newest: "📅 Newest first",
  sort_oldest: "⏳ Oldest first",
  sort_title_asc: "🔤 Title (A-Z)",
  sort_title_desc: "🔠 Title (Z-A)",

  // Upload Modal
  upload_title: "📤 Upload Manga",
  upload_manga_title: "Manga Title *",
  upload_manga_title_ph: "Title...",
  upload_author: "Author",
  upload_author_ph: "Author name...",
  upload_desc: "Description",
  upload_desc_ph: "Summary...",
  upload_genre: "Category *",
  upload_status: "Status",
  upload_status_ongoing: "Ongoing",
  upload_status_completed: "Completed",
  upload_tags: "Tags (press Enter to add)",
  upload_tags_ph: "Add tag...",
  upload_files_label: "Manga pages — Images (JPG/PNG/WebP) or PDF",
  upload_btn_cancel: "Cancel",
  upload_btn_submit: "Upload",
  upload_btn_uploading: "Uploading...",
  upload_converting: "Converting PDF...",
};

export default en;
