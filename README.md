# job-recommendation-system
Demo hệ thống tư vấn vị trí việc làm cho sinh viên ngành Quản lý thông tin USSH VNU-HCM

Hướng dẫn sử dụng Demo hệ thống tư vấn vị trí việc làm cho sinh viên ngành Quản lý thông tin USSH VNU-HCM
1. Chuẩn bị file hồ sơ đối sánh
Trước khi sử dụng hệ thống, người dùng tải một trong ba file hồ sơ đối sánh trong thư mục profiles_data của GitHub:
Junior_student_profile.xlsx: dùng để đối sánh với hồ sơ sinh viên năm 3, gồm các Kiến thức - Kỹ năng - Công cụ tích lũy từ năm 1 đến hết năm 3.
Senior_student_profile.xlsx: dùng để đối sánh với hồ sơ sinh viên năm 4, gồm các Kiến thức - Kỹ năng - Công cụ tích lũy từ năm 1 đến hết năm 4.
Course_learning_profile.xlsx: dùng để đối sánh với hồ sơ chương trình đào tạo, gồm toàn bộ Kiến thức - Kỹ năng - Công cụ được trích xuất từ chương trình đào tạo.
Lưu ý: Các file trên là hồ sơ học tập/ hồ sơ chương trình đào tạo dùng cho mục đích thử nghiệm, không phải hồ sơ cá nhân hóa của từng sinh viên.
2. Truy cập hệ thống demo
Người dùng truy cập đường link Demo Hệ thống thử nghiệm tư vấn vị trí việc làm: https://eviekhoale.github.io/job-recommendation-system/  
Luồng 1: Đối sánh hồ sơ học tập với từng tin tuyển dụng
Bước 1. Tìm kiếm vị trí việc làm
Người dùng có thể tìm kiếm tin tuyển dụng bằng một trong hai cách:
Cách 1: Nhập tên vị trí việc làm vào ô tìm kiếm trên trang chủ. Ví dụ: Data Analyst.
Cách 2: Chọn mục Việc làm trên thanh điều hướng.
Bước 2. Xem danh sách kết quả
Hệ thống chuẩn hóa từ khóa tìm kiếm, đối chiếu với dữ liệu tuyển dụng đã lưu trữ và trả về danh sách các tin tuyển dụng phù hợp.
Ví dụ: Khi nhập từ khóa Data Analyst, hệ thống hiển thị danh sách các tin tuyển dụng phù hợp với từ khóa này.
Bước 3. Xem chi tiết tin tuyển dụng
Người dùng chọn một tin tuyển dụng bất kỳ trong danh sách kết quả rồi ấn vào nút Chi tiết. Giao diện sẽ chuyển sang trang Chi tiết tin tuyển dụng. Tại đây, hệ thống hiển thị Mô tả công việc, Yêu cầu công việc và Các thực thể Kiến thức - Kỹ năng - Công cụ được trích xuất từ tin tuyển dụng.
Bước 4. Tải lên file hồ sơ đối sánh
Người dùng chọn nút Đối sánh với hồ sơ học tập và tải lên một trong ba file đã chuẩn bị ở Bước 1.
Bước 5. Xem kết quả đối sánh
Sau khi đối sánh thành công, hệ thống hiển thị bảng Kết quả đối sánh gồm:
Mức độ phù hợp.
Tổng số Kiến thức - Kỹ năng - Công cụ của tin tuyển dụng.
Số mục trùng khớp.
Số mục còn thiếu.
Danh sách Kiến thức - Kỹ năng - Công cụ đã phù hợp.
Mức độ phù hợp được chia thành ba nhóm kết quả:
Từ 70% trở lên: mức độ phù hợp tương đối cao.
Từ 40% đến dưới 70%: mức độ phù hợp trung bình.
Dưới 40%: mức độ phù hợp tương đối thấp.
Luồng 2: Đối sánh hồ sơ học tập với hồ sơ vị trí việc làm
Bước 1. Truy cập hồ sơ vị trí việc làm
Người dùng chọn mục Hồ sơ vị trí trên thanh điều hướng của Trang chủ.
Bước 2. Chọn vị trí cần xem
Người dùng có thể chọn hồ sơ vị trí bằng một trong hai cách:
Nhập từ khóa vào thanh tìm kiếm.
Chọn nhanh thông qua mục Chọn hồ sơ vị trí.
Bước 3. Xem chi tiết hồ sơ vị trí
Sau khi chọn một vị trí, hệ thống hiển thị trang chi tiết của hồ sơ vị trí việc làm. Tại đây có các thông tin Tên vị trí, Lĩnh vực nghề nghiệp, Số lượng tin tuyển dụng đại diện và Danh sách Kiến thức - Kỹ năng - Công cụ đặc trưng của vị trí đó.
Bước 4. Tải lên file hồ sơ đối sánh
Người dùng chọn nút Đối sánh với hồ sơ học tập và tải lên một trong ba file đã chuẩn bị ở phần đầu.
Bước 5. Xem kết quả đối sánh
Sau khi đối sánh thành công, hệ thống hiển thị bảng Kết quả đối sánh, gồm:
Mức độ phù hợp.
Tổng số Kiến thức - Kỹ năng - Công cụ của hồ sơ vị trí.
Số mục trùng khớp.
Số mục còn thiếu.
Danh sách Kiến thức - Kỹ năng - Công cụ đã phù hợp.
Mức độ phù hợp được chia thành:
Từ 70% trở lên: mức độ phù hợp tương đối cao.
Từ 40% đến dưới 70%: mức độ phù hợp trung bình.
Dưới 40%: mức độ phù hợp tương đối thấp.
