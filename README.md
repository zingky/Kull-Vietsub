@ -0,0 +1,147 @@
# 🎬 YOUTUBE AEGISUB LOADER by Gemini x Kull

**YouTube Subtitle Engine** is a powerful Chrome Extension designed to render Aegisub subtitles (.ass) directly on YouTube with full karaoke support, per-style overrides, multi-source GitHub fetching, and advanced overlap handling.

[Tiếng Việt bên dưới](#tiếng-việt)

---

## 🌟 Key Features

### 📂 Smart Subtitle Loading
- **Multi-Source GitHub Fetching:** Add, remove, enable/disable multiple GitHub repositories as subtitle sources. Merge results from all enabled sources automatically.
- **Smart Search Dropdown:** Real-time search with title-based relevance sorting. Shows matching files ranked by video title keywords.
- **Auto-Fetch by Video ID:** Automatically loads matching `.ass` files from all enabled sources based on the YouTube Video ID.
- **Local Caching:** Subtitle data is cached per Video ID (chrome.storage.local) for instant reloads.
- **File List Cache:** GitHub file lists are cached locally, reducing API calls. Refresh manually with the 🔍 button.

### 🎤 Karaoke Engine
- **Three-state karaoke:** Pre-singing, Active (with configurable Zoom In/Out), Post-singing — each fully customizable.
- **Syllable-level effects:** Outline, Blur, Zoom, and color transitions per syllable.
- **Per-syllable K timing:** Precise `\k` tag support with millisecond accuracy.

### 🎨 Advanced Styling
- **Global Settings:** Font Size, Outline Width, Blur, Text Color (1c), Outline Color (3c), Fade In/Out.
- **Per-Style Override (⚙️):** Enable override for individual styles to customize Size(S), Outline(O), Blur(B) and position (X, Y) independently.
- **Per-Style Reset (⟳):** Reset X, Y, S, O, B to defaults for each style individually.
- **Per-Style Visibility:** Hide/unhide any subtitle style with the 👁️ toggle.
- **Text Formatting:** **Bold**, *Italic*, <u>Underline</u>, ~~Strikethrough~~, with multiple font options including built-in **VNF-Comic Sans**.
- **Karaoke Tab:** Dedicated tab for Pre, Active, Post karaoke state customization.
- **Deep Glow:** Enhanced neon glow effect (Advanced tab).

### 📐 Positioning & Overlap
- **Automatic Overlap Prevention:** When multiple subtitle lines occupy the same Y position without explicit `\pos()`, they are automatically stacked vertically (like Aegisub) with `fontSize + 10px` spacing.
- **Explicit Positioning Respect:** Lines with `\pos()` in the ASS file are never moved — manual placement is preserved.
- **Constrain to Video Frame:** Prevents subtitles from spilling into black letterbox bars on 16:10/ultrawide monitors during fullscreen. Toggle ON/OFF in the footer settings.

### ✨ UI & Convenience
- **Glassmorphism Design:** Clean, semi-transparent dark interface with blur backdrop.
- **Draggable & Resizable:** Drag the title bar to reposition, drag the center divider to resize panels.
- **Zoom & Opacity:** Adjust the entire UI scale (1.0–1.3) and background opacity via header sliders.
- **Pill Tabs:** Switch between Settings ⚙️, Karaoke 🎤, and Advanced 🛠️ tabs.
- **Pill Tabs:** Settings (⚙️), Karaoke (🎤), Advanced (🛠️).
- **Header Info:** Shows current Video ID, auto-sub status indicator.
- **Footer Settings Panel (⚙️):** Quick access to:
  - Close-on-click-outside toggle
  - Constrain to Video Frame toggle
  - Sub Sources manager (add/remove/enable GitHub repos)
  - Data Management: Backup All (*.json), Export Current Video, Import (*.json)
- **Local Storage Persistence:** All settings, style overrides, and sources are saved automatically.

### 🖥️ Fullscreen & Responsive
- **Fullscreen Detection:** Subtitles and engine adapt to fullscreen mode automatically (font +10px).
- **Active Video Rect Calculation:** Subtitles stay within the actual video area, avoiding black bars.
- **YouTube Controls Compatible:** Subtitles render behind the YouTube controls bar (`.ytp-chrome-bottom`), never obstructing playback controls.

---

## ⚠️ Important Note
This extension uses **HTML/CSS rendering**, which means it supports **most basic to intermediate Aegisub features**. Complex effects like vector drawings, advanced transformations (\t), or layered overlapping may not display identically to professional players like VLC or MPC-HC.

---

## 🛠 Installation (Developer Mode)

1. **Download** this repository and extract the files.
2. Ensure `vnf-comic-sans.ttf` is present in the folder.
3. Open Chrome and go to `chrome://extensions/`.
4. Enable **Developer mode** (top right).
5. Click **Load unpacked** and select your extension folder.
6. **Pin** the extension for easy access.

---

<a name="tiếng-việt"></a>
# 🎬 YOUTUBE AEGISUB LOADER by Gemini x Kull (Bản Tiếng Việt)

**YouTube Subtitle Engine** là tiện ích mở rộng Chrome mạnh mẽ, giúp hiển thị phụ đề Aegisub (.ass) trực tiếp trên YouTube với hỗ trợ karaoke đầy đủ, tùy chỉnh từng style, lấy file sub từ nhiều nguồn GitHub, và xử lý chồng chéo dòng sub thông minh.

---

## 🌟 Tính năng chính

### 📂 Tải Sub Thông Minh
- **Đa nguồn GitHub:** Thêm, xoá, bật/tắt nhiều kho GitHub làm nguồn sub. Kết quả từ tất cả nguồn đang bật được tự động gộp vào danh sách.
- **Tìm kiếm thông minh:** Ô tìm kiếm có gợi ý drop-down sắp xếp theo độ liên quan tới tiêu đề video.
- **Tự động tải theo Video ID:** Tự động tìm và tải file `.ass` phù hợp từ tất cả nguồn dựa trên ID video YouTube.
- **Lưu cache cục bộ:** Nội dung sub được lưu theo từng Video ID (chrome.storage.local) để tải lại siêu tốc.
- **Cache danh sách file:** Danh sách file từ GitHub được cache lại, giảm số lần gọi API. Nhấn nút 🔍 để làm mới thủ công.

### 🎤 Engine Karaoke
- **Ba trạng thái karaoke:** Pre (chờ hát), Active (đang hát - có Zoom In/Out), Post (hát xong) — mỗi trạng thái có thể tuỳ chỉnh riêng.
- **Hiệu ứng từng âm tiết:** Outline, Blur, Zoom và chuyển màu theo từng syllable.
- **Định thời K chính xác:** Hỗ trợ tag `\k` với độ chính xác mili giây.

### 🎨 Tùy Chỉnh Style Nâng Cao
- **Cài đặt toàn cục:** Cỡ chữ (Size), Độ dày viền (Outline), Độ mờ viền (Blur), Màu chữ (1c), Màu viền (3c), Fade In/Out.
- **Ghi đè từng Style (⚙️):** Bật chế độ ghi đè cho từng style riêng lẻ để tuỳ chỉnh Size(S), Outline(O), Blur(B) và toạ độ (X, Y) độc lập.
- **Reset từng Style (⟳):** Đặt lại X, Y, S, O, B về mặc định cho từng style.
- **Ẩn/Hiện Style:** Dùng nút 👁️ để ẩn hoặc hiện bất kỳ style sub nào.
- **Định dạng chữ:** **Đậm (B)**, *Nghiêng (I)*, <u>Gạch chân (U)</u>, ~~Gạch ngang (S)~~, nhiều font chữ lựa chọn kèm font **VNF-Comic Sans** tích hợp sẵn.
- **Tab Karaoke riêng:** Giao diện riêng cho chỉnh Pre, Active, Post.
- **Deep Glow:** Hiệu ứng phát sáng neon tăng cường (tab Advanced).

### 📐 Định Vị & Chống Chồng Chéo
- **Tự động dãn dòng khi trùng Y:** Khi nhiều dòng sub có cùng vị trí Y mà không có `\pos()`, chúng được tự động xếp dọc với khoảng cách `fontSize + 10px` (giống Aegisub).
- **Tôn trọng vị trí đã đặt:** Các dòng có `\pos()` trong file ASS sẽ giữ nguyên vị trí, không bị dời đi.
- **Giới hạn trong khung hình video (Constrain to Video Frame):** Ngăn sub tràn ra viền đen khi xem fullscreen trên màn hình 16:10 hoặc ultrawide. Bật/tắt trong footer settings.

### ✨ Giao Diện & Tiện Lợi
- **Glassmorphism:** Giao diện tối trong suốt với hiệu ứng mờ.
- **Kéo & Thay đổi kích thước:** Kéo thanh tiêu đề để di chuyển, kéo thanh phân cách giữa để thay đổi kích thước bảng điều khiển.
- **Zoom & Opacity:** Điều chỉnh tỷ lệ giao diện (1.0–1.3) và độ mờ nền qua thanh trượt ở header.
- **Pill Tabs:** Chuyển đổi giữa các tab Settings ⚙️, Karaoke 🎤, Advanced 🛠️.
- **Thông tin Header:** Hiển thị Video ID, trạng thái sub.
- **Footer Settings Panel (⚙️):** Truy cập nhanh:
  - Bật/tắt đóng popup khi click ra ngoài
  - Bật/tắt Constrain to Video Frame
  - Quản lý nguồn Sub (thêm/xoá/bật GitHub repos)
  - Quản lý dữ liệu: Backup All (*.json), Export Video hiện tại, Import (*.json)
- **Lưu trữ tự động:** Tất cả cài đặt, ghi đè style, danh sách nguồn được tự động lưu vào localStorage.

### 🖥️ Fullscreen & Tương Thích
- **Phát hiện Fullscreen:** Sub và engine tự động thích ứng khi vào fullscreen (tăng font +10px).
- **Tính toán vùng video thực tế:** Sub luôn nằm trong khung hình video, tránh viền đen.
- **Tương thích nút điều khiển:** Sub hiển thị bên dưới thanh controls YouTube (`.ytp-chrome-bottom`), không che nút điều khiển.

---

## ⚠️ Lưu ý quan trọng
Vì tiện ích này hiển thị phụ đề bằng **HTML/CSS**, nó hỗ trợ **hầu hết các hiệu ứng Aegisub cơ bản đến trung cấp**. Các hiệu ứng phức tạp (vẽ hình vector, chuyển động \t phức tạp, xếp lớp chồng chéo) có thể không hiển thị giống hệt như trên VLC hay MPC-HC.

---

## 🛠 Hướng dẫn cài đặt

1. **Tải về** và giải nén thư mục extension.
2. Đảm bảo file font `vnf-comic-sans.ttf` nằm trong thư mục.
3. Mở Chrome, truy cập: `chrome://extensions/`.
4. Bật **Chế độ dành cho nhà phát triển** (góc trên bên phải).
5. Nhấn **Tải tiện ích đã giải nén** và chọn thư mục chứa extension.
6. **Ghim (Pin)** tiện ích lên thanh công cụ để sử dụng.

---

## 🤝 Credits
- Developed by **Gemini** & **Kull**.
- Repository: [https://github.com/zingky/Kull-Vietsub](https://github.com/zingky/Kull-Vietsub)
