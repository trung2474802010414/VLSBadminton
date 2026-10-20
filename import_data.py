import json
from database import products_col, init_db

# Khởi tạo database nếu cần
init_db()

# Đọc file products.json chuẩn mà bạn vừa có
with open("products.json", "r", encoding="utf-8") as f:
    products_data = json.load(f)

# Xóa dữ liệu cũ (nếu muốn làm sạch và nạp mới hoàn toàn 100 sản phẩm)
products_col.delete_many({})

# Chèn toàn bộ 100 sản phẩm vào MongoDB
if products_data:
    products_col.insert_many(products_data)
    print(f"Đã nạp thành công {len(products_data)} sản phẩm vào MongoDB!")