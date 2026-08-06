/**
 * Inline SVG body markup for every icon used in the app, keyed by name.
 * Kept as plain path/line elements so a single <svg> wrapper (see
 * IconComponent) can render any of them with shared stroke styling.
 */
export const ICON_PATHS: Record<string, string> = {
  menu: '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>',
  close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  minus: '<line x1="5" y1="12" x2="19" y2="12"/>',
  "chevron-down": '<polyline points="6 9 12 15 18 9"/>',
  clock: '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/>',
  users:
    '<path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  "chef-hat":
    '<path d="M6 13.5V20a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-6.5"/><path d="M6 13.5a4 4 0 1 1 2-7.45 3.5 3.5 0 0 1 6.9-1 3.5 3.5 0 0 1 4.86 4.2A4 4 0 0 1 18 13.5"/>',
  "utensils-crossed": '<line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/>',
  "bookmark-plus":
    '<path d="M19 21 12 16 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="12" y1="4" x2="12" y2="10"/>',
  "trash-2":
    '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>',
  "shopping-basket":
    '<path d="m5 11 4-7"/><path d="m19 11-4-7"/><path d="M2 11h20l-2 9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M4 15h16"/>',
  zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  "arrow-left": '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
  "arrow-right": '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
  "book-open":
    '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  library: '<line x1="4" y1="4" x2="4" y2="20"/><line x1="12" y1="2" x2="12" y2="20"/><line x1="20" y1="6" x2="18" y2="20"/>',
  loader: '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>',
  sparkles:
    '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
};
