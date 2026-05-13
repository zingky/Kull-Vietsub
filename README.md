# 🎬 YOUTUBE AEGISUB LOADER by Gemini x Kull

**YouTube Subtitle Engine** is a simple Chrome Extension designed to render basic Aegisub subtitles directly on YouTube. It provides a lightweight solution for viewing `.ass` files with essential styling and simple karaoke effects.

[Tiếng Việt bên dưới](#tiếng-việt)

---

## 🌟 Key Features

- **📂 Basic Auto-Fetch:** Automatically searches for `.ass` files from a GitHub repository based on the Video ID.
- **🎤 Simple Karaoke Effect:** Supports basic `\k` tags with three states: *Pre-singing*, *Active (with basic Zoom)*, and *Post-singing*.
- **🎨 Essential Styling:**
    - Basic control over Font Size, Outline width, and Blur.
    - Simple text formatting: **Bold**, *Italic*, <u>Underline</u>, and ~~Strikethrough~~.
    - Built-in support for **VNF-Comic Sans** font.
- **✨ Clean UI:**
    - **Glassmorphism Design:** Simple transparent interface.
    - **Manual Adjustments:** Resizable and draggable settings menu.
    - **UI Scaling:** Adjust the menu font size for better visibility.
- **💾 Local Caching:** Saves subtitle data and basic settings per Video ID using local storage.
- **🖥️ Fullscreen Mode:** Automatically adjusts font size (+10px) when entering fullscreen.

---

## ⚠️ Important Note
This extension uses **HTML/CSS rendering**, which means it only supports **basic Aegisub features**. Complex effects like vector drawings, complex transformations (\t), or advanced positioning may not display as intended compared to professional players like VLC or MPC-HC.

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

**YouTube Subtitle Engine** là một tiện ích mở rộng đơn giản giúp hiển thị các phụ đề Aegisub cơ bản ngay trên YouTube. Đây là giải pháp gọn nhẹ để xem file `.ass` với các tùy chỉnh kiểu chữ thiết yếu và hiệu ứng karaoke đơn giản.

## 🌟 Tính năng chính

- **📂 Tự động tải cơ bản:** Tự động tìm kiếm file `.ass` từ GitHub dựa trên ID video đang xem.
- **🎤 Hiệu ứng Karaoke đơn giản:** Hỗ trợ các tag `\k` cơ bản với 3 trạng thái: *Chờ hát*, *Đang hát (Phóng to nhẹ)*, và *Hát xong*.
- **🎨 Tùy chỉnh Style thiết yếu:**
    - Chỉnh cỡ chữ, độ dày viền và độ mờ viền cơ bản.
    - Định dạng: **Đậm**, *Nghiêng*, <u>Gạch chân</u>, ~~Gạch ngang~~.
    - Tích hợp sẵn font chữ **VNF-Comic Sans**.
- **✨ Giao diện gọn gàng:**
    - **Glassmorphism:** Giao diện kính mờ đơn giản, dễ nhìn.
    - **Tùy biến Menu:** Có thể kéo dãn kích thước và thay đổi vị trí menu cài đặt.
    - **UI Scaling:** Thay đổi kích thước chữ của menu cài đặt.
- **💾 Ghi nhớ cục bộ:** Lưu nội dung sub và cài đặt theo từng ID Video vào bộ nhớ trình duyệt.
- **🖥️ Hỗ trợ Fullscreen:** Tự động tăng cỡ chữ (+10px) khi xem toàn màn hình.

---

## ⚠️ Lưu ý quan trọng
Vì tiện ích này hiển thị phụ đề bằng **HTML/CSS**, nên nó chỉ hỗ trợ các **hiệu ứng Aegisub cơ bản**. Các hiệu ứng phức tạp (vẽ hình vector, chuyển động \t phức tạp, chồng lớp...) sẽ không thể hiển thị hoàn hảo như trên các trình phát chuyên dụng như VLC hay MPC-HC.

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
