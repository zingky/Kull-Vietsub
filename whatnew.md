## 🚀 What's New in v8.0
- **Per-Style Font from Aegisub:** Each subtitle style now uses its original font defined in the ASS file (when per-style toggle is ON). Unknown/unavailable fonts fall back to VNF-Comic Sans with a ⚠️ indicator.
- **Active Karaoke Colors are Configurable:** kActive tab 1c/3c can now be freely adjusted in the Karaoke settings panel (no longer hardcoded).
- **"All" → "Use Global Setting":** The master toggle above styles list is now clearly labeled.
- **Default 3c = Red:** Active karaoke outline color defaults to red when loading an ASS file for the first time.
- **Style Defaults:** All styles default to fontSize 23, outlineWidth 2, blur 2. Reset (⟳) restores original Aegisub colors + these defaults.
- **Style List Cleanup:** Old styles are cleared when a new ASS file is loaded.
- **Large Style Lists:** If more than 4 styles exist, the container switches to manual scrolling instead of auto-expanding.
- **Bug Fixes:** Outline parsing from Aegisub now reads the correct field (index 16), not Bold.

## 🚀 Có gì mới ở bản v8.0
- **Font riêng cho từng Style:** Mỗi style sub dùng đúng font gốc từ file ASS (khi bật tick ⚙️). Font lạ không có trong máy sẽ tự động fallback về VNF-Comic Sans và hiển thị ⚠️.
- **Màu Active Karaoke có thể chỉnh:** Tab kActive 1c/3c giờ có thể tuỳ chỉnh thoải mái trong bảng Karaoke (không còn hardcode nữa).
- **"All" → "Use Global Setting":** Nút gạt trên đầu danh sách style được đổi tên rõ ràng.
- **3c mặc định = màu Đỏ:** Màu viền active karaoke mặc định là đỏ khi load file ASS lần đầu.
- **Mặc định Style:** Tất cả style mặc định fontSize 23, outlineWidth 2, blur 2. Nút Reset (⟳) khôi phục màu gốc từ Aegisub + các giá trị mặc định này.
- **Xoá Style cũ:** Danh sách style được xoá sạch khi load file ASS mới.
- **Nhiều Style:** Khi có hơn 4 style, container chuyển sang scroll thủ công thay vì tự động mở rộng.
- **Sửa lỗi:** Đọc outline từ Aegisub đúng field (index 16), không còn bị lấy nhầm giá trị Bold.

## 🚀 What's New in v7.9.9
- **Multi-Source GitHub:** Add, remove, enable/disable multiple GitHub repos as subtitle sources. Results from all enabled sources are merged automatically.
- **Smart Search Dropdown:** Real-time file search with title-based relevance sorting. Shows matching files ranked by video title keywords.
- **Constrain to Video Frame:** Keeps subtitles inside the actual video area, avoiding black letterbox bars on 16:10/ultrawide monitors.
- **Overlap Prevention:** Automatically stacks overlapping subtitle lines with proper vertical spacing (respects `\pos()`).
- **Per-Style Reset (⟳):** Reset X, Y, Size, Outline, Blur to defaults for each style individually.
- **Per-Style Visibility:** Hide/unhide any subtitle style with 👁️ toggle.
- **Deep Glow:** Enhanced neon glow effect (Advanced tab).
- **Footer Settings Panel:** Quick toggles (close-on-click-outside, constrain-to-video) + Sub Sources manager + Data Backup/Export/Import.
- **Zoom & Opacity Sliders:** Adjust popup scale (1.0–1.3) and background opacity directly from header.
- **Draggable Divider:** Resize left/right panels by dragging the center divider.
- **YouTube Controls Compatible:** Subtitles render behind the controls bar, never blocking playback buttons.
- **Code Split:** Content script modularized into globals.js, parser.js, engine-css.js, ui.js, main.js for better maintainability.

## 🛠 Installation (v8.0 / v7.9.9)
1. Download `YouTube_Aegisub_Loader_v8.0.zip` below and extract it.
2. Go to `chrome://extensions/` and enable **Developer mode**.
3. Click **Load unpacked** and select the extracted folder.
4. Pin the extension to your toolbar.

## 🛠 Hướng dẫn cài đặt (v8.0 / v7.9.9)
1. Tải file `YouTube_Aegisub_Loader_v8.0.zip` bên dưới và giải nén.
2. Truy cập `chrome://extensions/` và bật **Chế độ nhà phát triển**.
3. Nhấn **Tải tiện ích đã giải nén** và chọn thư mục vừa giải nén.
4. Ghim tiện ích lên thanh công cụ để sử dụng.

## 🚀 What's New in v7.9
- **Auto-Sync Engine:** Automatically fetches subtitles from GitHub based on YouTube Video ID.
- **Enhanced UI:** Clean, horizontal Glassmorphism interface.
- **Advanced Karaoke:** Supports 3-tab configuration (Pre/Active/Post) with Smooth Zoom effects.
- **Font Support:** Built-in VNF-Comic Sans and standard Windows fonts.
- **ID Display:** Shows current Video ID for easier management.
- **Smart Cache:** Saves all settings per Video ID locally.

## 🛠 Installation (v7.9)
1. Download `YouTube_Aegisub_Loader_v7.9.zip` below and extract it.
2. Go to `chrome://extensions/` and enable **Developer mode**.
3. Click **Load unpacked** and select the extracted folder.
4. Pin the extension to your toolbar.

## 🚀 Có gì mới ở bản v7.9
- **Tự động đồng bộ:** Tự động tìm và nạp phụ đề từ GitHub theo ID Video.
- **Giao diện tối ưu:** Menu ngang phong cách kính mờ hiện đại, dễ thao tác.
- **Karaoke chuyên sâu:** Cài đặt 3 trạng thái (Pre/Active/Post) với hiệu ứng Phóng to (Zoom) mượt mà.
- **Hỗ trợ Font:** Tích hợp VNF-Comic Sans và các font tiếng Việt chuẩn Windows.
- **Hiển thị ID:** Hiện ID video trực tiếp trên menu để dễ quản lý.
- **Ghi nhớ thông minh:** Lưu lại mọi tùy chỉnh theo từng video riêng biệt.

## 🛠 Hướng dẫn cài đặt (v7.9)
1. Tải file `YouTube_Aegisub_Loader_v7.9.zip` bên dưới và giải nén.
2. Truy cập `chrome://extensions/` và bật **Chế độ nhà phát triển**.
3. Nhấn **Tải tiện ích đã giải nén** và chọn thư mục vừa giải nén.
4. Ghim tiện ích lên thanh công cụ để sử dụng.