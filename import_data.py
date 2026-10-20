import json
from database import products_col, init_db

# Khởi tạo kết nối database (nếu dùng MongoDB Atlas, file database.py của bạn đã nhận biến MONGO_URI)
init_db()

# Đọc file products.json chứa 100 sản phẩm vừa chuẩn hóa
with open("products.json", "r", encoding="utf-8") as f:
    products_data = json.load(f)

# Xóa dữ liệu cũ và nạp mới hoàn toàn 100 sản phẩm
products_col.delete_many({})
if products_data:
    products_col.insert_many(products_data)
    print(f"Đã nạp thành công {len(products_data)} sản phẩm vào MongoDB!")