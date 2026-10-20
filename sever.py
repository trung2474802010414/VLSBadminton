from datetime import datetime
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import os
import re
import sys
from urllib.parse import parse_qs, urlparse

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)
os.chdir(BASE_DIR)

from database import DB_NAME, admins_col, bank_col, init_db, orders_col, products_col

HOST = "localhost"
PORT = 8000


def get_next_id(col):
    last = col.find_one(sort=[("id", -1)])
    return (last["id"] + 1) if last and "id" in last else 1


class BadmintonShopHandler(BaseHTTPRequestHandler):

    def _send_response(self, content, status=200, content_type="text/html"):
        self.send_response(status)
        self.send_header("Content-type", f"{content_type}; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        if isinstance(content, str):
            self.wfile.write(content.encode("utf-8"))
        else:
            self.wfile.write(json.dumps(content, ensure_ascii=False).encode("utf-8"))

    def do_GET(self):
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        query_params = parse_qs(parsed_url.query)

        if path == "/":
            with open("index.html", "r", encoding="utf-8") as f:
                self._send_response(f.read(), 200, "text/html")

        elif path == "/admin":
            with open("admin.html", "r", encoding="utf-8") as f:
                self._send_response(f.read(), 200, "text/html")

        elif path.endswith(".jsx"):
            file_path = path.lstrip("/")
            if os.path.exists(file_path):
                with open(file_path, "r", encoding="utf-8") as f:
                    self._send_response(f.read(), 200, "application/javascript")
            else:
                self._send_response("404 Not Found", 404, "text/plain")

        elif path.endswith(".css"):
            file_path = path.lstrip("/")
            if os.path.exists(file_path):
                with open(file_path, "r", encoding="utf-8") as f:
                    self._send_response(f.read(), 200, "text/css")
            else:
                self._send_response("404 Not Found", 404, "text/plain")

        elif path.endswith(".js"):
            file_path = path.lstrip("/")
            if os.path.exists(file_path):
                with open(file_path, "r", encoding="utf-8") as f:
                    self._send_response(f.read(), 200, "application/javascript")
            else:
                self._send_response("404 Not Found", 404, "text/plain")

        elif path == "/api/products":
            category = query_params.get("category", ["all"])[0]
            search = query_params.get("search", [""])[0].strip()
            brand_param = query_params.get("brand", [""])[0].strip()
            prices_raw = query_params.get("prices", [""])[0]
            size_param = query_params.get("size", [""])[0].strip()

            query = {}
            if category == "sale":
                query["sale_percent"] = {"$gt": 0}
            elif category != "all":
                query["category"] = category

            if search:
                regex = re.compile(re.escape(search), re.IGNORECASE)
                query["$or"] = [{"name": regex}, {"brand": regex}]

            # Lọc theo 1 Thương hiệu duy nhất
            if brand_param:
                query["brand"] = {"$regex": re.escape(brand_param), "$options": "i"}

            # Lọc theo Size giày (đã kiểm tra tránh lỗi null)
            if size_param and size_param != "null" and size_param != "":
                size_regex = re.compile(re.escape(size_param), re.IGNORECASE)
                size_query = [{"size": size_regex}, {"name": size_regex}]
                if "$or" in query:
                    query = {"$and": [query, {"$or": size_query}]}
                else:
                    query["$or"] = size_query

            # Lọc theo Mức giá
            if prices_raw:
                try:
                    prices_list = json.loads(prices_raw)
                    price_conditions = []
                    for p_str in prices_list:
                        p_lower = p_str.lower()
                        if "dưới 500" in p_lower:
                            price_conditions.append({"price": {"$lt": 500000}})
                        elif "500.000đ - 1 triệu" in p_lower or "500.000" in p_lower:
                            price_conditions.append({"price": {"$gte": 500000, "$lte": 1000000}})
                        elif "1 - 2 triệu" in p_lower:
                            price_conditions.append({"price": {"$gte": 1000000, "$lte": 2000000}})
                        elif "2 - 3 triệu" in p_lower:
                            price_conditions.append({"price": {"$gte": 2000000, "$lte": 3000000}})
                        elif "trên 3 triệu" in p_lower:
                            price_conditions.append({"price": {"$gt": 3000000}})
                    
                    if price_conditions:
                        if "$or" in query:
                            query = {"$and": [query, {"$or": price_conditions}]}
                        else:
                            query["$or"] = price_conditions
                except:
                    pass

            products = list(products_col.find(query, {"_id": 0}).sort("id", 1))
            self._send_response(products, 200, "application/json")

        elif path == "/api/orders":
            orders = list(orders_col.find({}, {"_id": 0}).sort("id", -1))
            self._send_response(orders, 200, "application/json")

        elif path == "/api/bank":
            bank = bank_col.find_one({}, {"_id": 0})
            self._send_response(bank if bank else {}, 200, "application/json")

        else:
            self._send_response({"error": "Not found"}, 404, "application/json")

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(content_length).decode("utf-8")
        data = json.loads(post_data) if post_data else {}

        if self.path == "/api/admin/login":
            admin = admins_col.find_one({
                "username": data.get("username"),
                "password": data.get("password"),
            })
            if admin:
                self._send_response(
                    {"success": True, "message": "Đăng nhập thành công!"},
                    200,
                    "application/json",
                )
            else:
                self._send_response(
                    {
                        "success": False,
                        "message": "Sai tài khoản hoặc mật khẩu!",
                    },
                    200,
                    "application/json",
                )

        elif self.path == "/api/admin/update-bank":
            bank_col.update_one(
                {"id": 1},
                {
                    "$set": {
                        "bank_code": data.get("bank_code"),
                        "account_no": data.get("account_no"),
                        "account_name": data.get("account_name"),
                    }
                },
                upsert=True,
            )
            self._send_response(
                {"success": True, "message": "Cập nhật ngân hàng thành công!"},
                200,
                "application/json",
            )

        elif self.path == "/api/checkout":
            order_id = get_next_id(orders_col)
            orders_col.insert_one({
                "id": order_id,
                "customer_name": data["name"],
                "phone": data["phone"],
                "address": data["address"],
                "items_json": json.dumps(data["items"], ensure_ascii=False),
                "total_price": data["total"],
                "status": "Chờ xác nhận",
                "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            })
            self._send_response(
                {"success": True, "order_id": order_id}, 200, "application/json"
            )

        elif self.path == "/api/admin/add":
            new_id = get_next_id(products_col)
            products_col.insert_one({
                "id": new_id,
                "name": data["name"],
                "brand": data["brand"],
                "category": data["category"],
                "price": int(data["price"]),
                "image": data["image"],
                "badge": data.get("badge", ""),
                "sale_percent": int(data.get("sale_percent", 0)),
            })
            self._send_response(
                {"success": True, "message": "Thêm sản phẩm vào MongoDB thành công!"},
                200,
                "application/json",
            )

        elif self.path == "/api/admin/update":
            products_col.update_one(
                {"id": int(data["id"])},
                {
                    "$set": {
                        "name": data["name"],
                        "brand": data["brand"],
                        "category": data["category"],
                        "price": int(data["price"]),
                        "image": data["image"],
                        "badge": data.get("badge", ""),
                        "sale_percent": int(data.get("sale_percent", 0)),
                    }
                },
            )
            self._send_response(
                {
                    "success": True,
                    "message": "Cập nhật sản phẩm trên MongoDB thành công!",
                },
                200,
                "application/json",
            )

        elif self.path == "/api/admin/delete":
            products_col.delete_one({"id": int(data["id"])})
            self._send_response(
                {"success": True, "message": "Đã xóa sản phẩm khỏi MongoDB!"},
                200,
                "application/json",
            )

        elif self.path == "/api/admin/order-status":
            orders_col.update_one(
                {"id": int(data["id"])}, {"$set": {"status": data["status"]}}
            )
            self._send_response(
                {
                    "success": True,
                    "message": "Đã cập nhật trạng thái đơn hàng!",
                },
                200,
                "application/json",
            )

        elif self.path == "/api/admin/order-delete":
            orders_col.delete_one({"id": int(data["id"])})
            self._send_response(
                {"success": True, "message": "Đã xóa đơn hàng!"},
                200,
                "application/json",
            )

        else:
            self._send_response({"error": "Not found"}, 404, "application/json")


if __name__ == "__main__":
    init_db()
    server = HTTPServer((HOST, PORT), BadmintonShopHandler)
    print("====================================================")
    print("🏸 SERVER VLSBADMINTON (MONGODB + REACT) ĐÃ CHẠY!")
    print(f"👉 Trang chủ khách hàng: http://{HOST}:{PORT}")
    print(f"👉 Trang quản trị Admin: http://{HOST}:{PORT}/admin")
    print("====================================================")
    server.serve_forever()