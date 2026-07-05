# 🎬 YouTube Aegisub Loader v7.9.9

A simple Chrome Extension to load and display basic Aegisub subtitles (.ass) on YouTube with karaoke support, per-style settings, and GitHub source management.

[Tiếng Việt bên dưới](#tiếng-việt)
<img width="1220" height="719" alt="image" src="https://github.com/user-attachments/assets/2adebc03-ae65-4f6f-b25e-93d121146922" />
---

## Features

- **Load .ass files** from your computer or auto-fetch from GitHub repositories based on Video ID
- **Multi-Source:** Add multiple GitHub repos as subtitle sources; merge results automatically
- **Smart Search:** Real-time file search with title-based relevance sorting
- **Basic Karaoke:** Three-state karaoke (Pre/Active/Post) with syllable-level effects using `\k` tags
- **Style Settings:** Global control over font size, outline, blur, text color, outline color
- **Per-Style Override:** Customize position (X, Y), size, outline, blur for each style individually
- **Overlap Prevention:** Auto-stack overlapping subtitle lines (respects `\pos()`)
- **Constrain to Video Frame:** Keep subtitles inside the actual video area, avoiding letterbox bars
- **UI Settings:** Draggable/resizable popup, zoom/opacity sliders, pill tabs (Settings ⚙️ / Karaoke 🎤 / Advanced 🛠️)
- **Footer Panel:** Quick toggles + Sub Sources manager + Data Import/Export/Backup
- **Local Storage:** Remembers settings, sources, and subtitle cache per Video ID
- **Fullscreen:** Font automatically adjusts (+10px) in fullscreen mode
- **YouTube Controls:** Subtitles render behind the controls bar, never blocking playback buttons

---

## ⚠️ Note

This extension uses **HTML/CSS rendering**, so it supports basic to intermediate Aegisub features. Complex effects (vector drawings, advanced \t transforms, layered overlaps) may not display identically to dedicated players like VLC or MPC-HC.

---

## Installation (Developer Mode)

1. **Download** or clone this repository.
2. Ensure `vnf-comic-sans.ttf` is in the `extension/` folder.
3. Open Chrome → `chrome://extensions/`.
4. Enable **Developer mode** (top right).
5. Click **Load unpacked** and select the `extension/` folder.
6. Visit any YouTube video → **SUB** button appears in the player controls.

---

<a name="tiếng-việt"></a>
# 🎬 YouTube Aegisub Loader v7.9.9 (Bản Tiếng Việt)

Một tiện ích Chrome đơn giản để tải và hiển thị phụ đề Aegisub (.ass) cơ bản trên YouTube, hỗ trợ karaoke, tùy chỉnh từng style, và quản lý nhiều nguồn GitHub.

---

## Tính năng

- **Tải file .ass** từ máy tính hoặc tự động lấy từ GitHub dựa trên ID video
- **Đa nguồn:** Thêm nhiều kho GitHub làm nguồn sub; tự động gộp kết quả
- **Tìm kiếm thông minh:** Tìm file realtime, sắp xếp theo độ liên quan với tiêu đề video
- **Karaoke cơ bản:** Ba trạng thái (Pre/Active/Post) với hiệu ứng từng âm tiết qua tag `\k`
- **Chỉnh style:** Cỡ chữ, viền, blur, màu chữ (1c), màu viền (3c)
- **Ghi đè từng Style:** Tùy chỉnh vị trí (X, Y), cỡ chữ, viền, blur riêng cho từng style
- **Chống chồng chéo:** Tự động dãn các dòng sub trùng vị trí (tôn trọng `\pos()`)
- **Giới hạn khung hình:** Giữ sub trong vùng video thực tế, tránh tràn ra viền đen
- **Giao diện:** Popup kéo/thả được, thanh trượt zoom/độ mờ, pill tab (Settings ⚙️ / Karaoke 🎤 / Advanced 🛠️)
- **Footer Panel:** Bật/tắt nhanh + quản lý nguồn Sub + sao lưu/xuất/nhập dữ liệu
- **Lưu trữ:** Ghi nhớ cài đặt, nguồn, cache sub theo từng Video ID
- **Fullscreen:** Tự động tăng cỡ chữ (+10px)
- **Nút điều khiển:** Sub hiển thị bên dưới thanh controls, không che nút bấm

---

## ⚠️ Lưu ý

Tiện ích dùng **HTML/CSS** để render phụ đề, nên chỉ hỗ trợ các hiệu ứng Aegisub từ cơ bản đến trung cấp. Các hiệu ứng phức tạp (vẽ vector, \t nâng cao, chồng lớp) có thể không hiển thị giống hệt như trên VLC hay MPC-HC.

---

## Cài đặt (Chế độ nhà phát triển)

1. **Tải về** hoặc clone repository này.
2. Đảm bảo file `vnf-comic-sans.ttf` nằm trong thư mục `extension/`.
3. Mở Chrome → `chrome://extensions/`.
4. Bật **Chế độ nhà phát triển** (góc trên phải).
5. Nhấn **Tải tiện ích đã giải nén** và chọn thư mục `extension/`.
6. Vào YouTube → nút **SUB** xuất hiện trên thanh điều khiển player.

---

## Credits

- Developed by **Gemini** & **Kull**
- Repository: [https://github.com/zingky/Kull-Vietsub](https://github.com/zingky/Kull-Vietsub)