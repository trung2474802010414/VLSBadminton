from pymongo import MongoClient

MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "VLSBadminton"

try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
    client.server_info()  # Kiểm tra xem MongoDB Server có đang bật không
    print("✅ Đã kết nối thành công vào MongoDB Server (localhost:27017)!")
except Exception:
    import mongomock

    print("⚠️ Dịch vụ MongoDB đang tắt -> Tự động chạy chế độ MongoDB giả lập!")
    client = mongomock.MongoClient()

db = client[DB_NAME]

# Các Collections (Bảng trong MongoDB)
products_col = db["products"]
orders_col = db["orders"]
admins_col = db["admins"]
bank_col = db["bank_config"]
users_col = db["users"]


def init_db():
    # 1. Khởi tạo tài khoản Admin mặc định
    if admins_col.count_documents({}) == 0:
        admins_col.insert_one(
            {"id": 1, "username": "admin", "password": "123"}
        )

    # 2. Khởi tạo cấu hình Ngân hàng QR mặc định
    if bank_col.count_documents({}) == 0:
        bank_col.insert_one({
            "id": 1,
            "bank_code": "MB",
            "account_no": "0909916319",
            "account_name": "VO THANH TRUNG",
        })

    # Các đường dẫn hình ảnh chuẩn từ CDN ShopVNB
    IMG_VOT_LINING_1 = "https://cdn.shopvnb.com/uploads/san_pham/vot-cau-long-lining-axforce-90-do-dragon-max-chinh-hang-1.webp"
    IMG_VOT_LINING_2 = "https://cdn.shopvnb.com/uploads/san_pham/vot-cau-long-lining-axforce-80-chinh-hang-1.webp"
    IMG_VOT_LINING_3 = "https://cdn.shopvnb.com/uploads/san_pham/vot-cau-long-lining-halbertec-8000-chinh-hang-1.webp"
    IMG_VOT_LINING_4 = "https://cdn.shopvnb.com/uploads/san_pham/vot-cau-long-lining-bladex-800-chinh-hang-1.webp"
    IMG_VOT_LINING_5 = "https://cdn.shopvnb.com/uploads/san_pham/vot-cau-long-lining-aeronaut-9000c-chinh-hang-1.webp"
    IMG_VOT_YONEX_1 = "https://cdn.shopvnb.com/uploads/san_pham/vot-cau-long-yonex-astrox-77-pro-chinh-hang-1.webp"
    IMG_VOT_YONEX_2 = "https://cdn.shopvnb.com/uploads/san_pham/vot-cau-long-yonex-astrox-100zz-kurenai-do-new-2021-5.webp"
    IMG_VOT_YONEX_3 = "https://cdn.shopvnb.com/uploads/san_pham/vot-cau-long-yonex-astrox-99-pro-do-chinh-hang-1.webp"
    IMG_VOT_YONEX_4 = "https://cdn.shopvnb.com/uploads/san_pham/vot-cau-long-yonex-arcsaber-11-pro-chinh-hang-1.webp"
    IMG_VOT_VICTOR = "https://cdn.shopvnb.com/uploads/san_pham/vot-cau-long-victor-thruster-ryuga-ii-chinh-hang-1.webp"

    IMG_GIAY_YONEX_1 = "https://cdn.shopvnb.com/uploads/san_pham/giay-cau-long-yonex-shb-65z3-men-trang-do-new-2022-1.webp"
    IMG_GIAY_YONEX_2 = "https://cdn.shopvnb.com/uploads/san_pham/giay-cau-long-yonex-shb-65z3-momota-new-2022-chinh-hang-1.webp"
    IMG_GIAY_YONEX_3 = "https://cdn.shopvnb.com/uploads/san_pham/giay-cau-long-yonex-eclipsion-z3-men-trang-vang-chinh-hang-1.webp"
    IMG_GIAY_LINING = "https://cdn.shopvnb.com/uploads/san_pham/giay-cau-long-lining-ayat005-1-chinh-hang-1.webp"
    IMG_GIAY_VICTOR = "https://cdn.shopvnb.com/uploads/san_pham/giay-cau-long-victor-p9200ii-chinh-hang-1.webp"

    IMG_PK_CAU = (
        "https://cdn.shopvnb.com/uploads/san_pham/ong-cau-long-hai-yen-s90-1.webp"
    )
    IMG_PK_CUOC = "https://cdn.shopvnb.com/uploads/san_pham/cuoc-dan-vot-yonex-bg-66-ultimax-1.webp"
    IMG_PK_QUANCAN = "https://cdn.shopvnb.com/uploads/san_pham/quan-can-vot-cau-long-yonex-ac102ex-1.webp"
    IMG_PK_BALO = "https://cdn.shopvnb.com/uploads/san_pham/balo-cau-long-yonex-bag2218t-1.webp"
    IMG_PK_BAOVOT = "https://cdn.shopvnb.com/uploads/san_pham/bao-vot-cau-long-yonex-ba92226ex-1.webp"


 