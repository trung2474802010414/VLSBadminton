// Chọn database của bạn
use('VLSBadminton');

// Thêm nhanh danh sách sản phẩm vào collection 'products'
db.getCollection('products').insertMany([
  {
    "id": 1,
    "name": "Vợt Cầu Lông Yonex Astrox 99 Pro",
    "brand": "Yonex",
    "category": "vot",
    "price": 3800000,
    "image": "https://file.hstatic.net/1000305540/file/astrox_99_pro_white_6a52934f82634e79b85c1815db9764de.jpg",
    "badge": "MỚI",
    "sale_percent": 10
  },
  {
    "id": 2,
    "name": "Giày Cầu Lông Yonex Power Cushion 65Z3",
    "brand": "Yonex",
    "category": "giay",
    "price": 2400000,
    "image": "https://file.hstatic.net/1000305540/file/giay_cau_long_yonex_65z3_wide_tr_re_dfb455b8efd54f5aa51368e59cادفec.jpg",
    "badge": "BÁN CHẠY",
    "sale_percent": 5
  }
]);

// Kiểm tra lại toàn bộ sản phẩm có trong collection
// Chọn đúng database của bạn
use('VLSBadminton');

// Lấy toàn bộ sản phẩm và chuyển thành mảng để in ra màn hình
const allProducts = db.getCollection('products').find().toArray();
console.log(allProducts);