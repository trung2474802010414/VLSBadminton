const { useState, useEffect } = React;

function AdminApp() {
    const [loggedIn, setLoggedIn] = useState(false);
    const [username, setUsername] = useState("admin");
    const [password, setPassword] = useState("123456");
    const [activeTab, setActiveTab] = useState("products");

    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [bank, setBank] = useState({ bank_code: "VCB", account_no: "", account_name: "" });

    const [toasts, setToasts] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [confirmData, setConfirmData] = useState(null);

    const showToast = (msg, isError = false) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, msg, isError }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    };

    const formatMoney = (num) => Math.round(num || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    const getFallbackImg = (category) => {
        if (category === 'vot') return 'https://cdn.shopvnb.com/uploads/san_pham/vot-cau-long-yonex-astrox-77-pro-chinh-hang-1.webp';
        if (category === 'giay') return 'https://cdn.shopvnb.com/uploads/san_pham/giay-cau-long-yonex-shb-65z3-men-trang-do-new-2022-1.webp';
        return 'https://cdn.shopvnb.com/uploads/san_pham/ong-cau-long-hai-yen-s90-1.webp';
    };

    const loadProducts = async () => {
        const res = await fetch('/api/products?category=all&search=');
        setProducts(await res.json());
    };

    const loadOrders = async () => {
        const res = await fetch('/api/orders');
        setOrders(await res.json());
    };

    const loadBank = async () => {
        const res = await fetch('/api/bank');
        const data = await res.json();
        if (data && data.bank_code) setBank(data);
    };

    const handleLogin = async () => {
        const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const result = await res.json();
        if (result.success) {
            setLoggedIn(true);
            loadProducts();
            loadOrders();
            loadBank();
            showToast("Đăng nhập quản trị VLSBadminton thành công!");
        } else {
            showToast(result.message, true);
        }
    };

    const handleSaveProduct = async () => {
        if (!editingProduct.name || !editingProduct.brand || !editingProduct.price || !editingProduct.image) {
            return showToast("Vui lòng điền đầy đủ thông tin!", true);
        }
        const endpoint = editingProduct.id ? '/api/admin/update' : '/api/admin/add';
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editingProduct)
        });
        const result = await res.json();
        if (result.success) {
            showToast(result.message);
            setModalOpen(false);
            loadProducts();
        }
    };

    const handleDeleteProduct = (id) => {
        setConfirmData({
            message: "Bạn có chắc chắn muốn xóa sản phẩm này khỏi MongoDB không?",
            onConfirm: async () => {
                const res = await fetch('/api/admin/delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id })
                });
                const result = await res.json();
                if (result.success) {
                    showToast("Đã xóa sản phẩm thành công!");
                    loadProducts();
                }
                setConfirmData(null);
            }
        });
    };

    const handleOrderStatus = async (id, status) => {
        const res = await fetch('/api/admin/order-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status })
        });
        const result = await res.json();
        if (result.success) {
            showToast(`Đơn #${id}: ${status}`);
            loadOrders();
        }
    };

    const handleDeleteOrder = (id) => {
        setConfirmData({
            message: `Bạn có chắc muốn xóa đơn hàng #${id} khỏi MongoDB?`,
            onConfirm: async () => {
                const res = await fetch('/api/admin/order-delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id })
                });
                const result = await res.json();
                if (result.success) {
                    showToast(`Đã xóa đơn hàng #${id}`);
                    loadOrders();
                }
                setConfirmData(null);
            }
        });
    };

    const handleSaveBank = async () => {
        const res = await fetch('/api/admin/update-bank', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bank)
        });
        const result = await res.json();
        showToast(result.message);
    };

    if (!loggedIn) {
        return (
            <div className="login-wrapper">
                <div id="toast-container">
                    {toasts.map(t => (
                        <div key={t.id} className={`toast ${t.isError ? 'error' : ''}`}>
                            <span>{t.isError ? '❌' : '✅'}</span> {t.msg}
                        </div>
                    ))}
                </div>
                <div className="login-box">
                    <h2>🔐 Quản Trị VLSBadminton</h2>
                    <div className="form-group">
                        <label>Tài khoản</label>
                        <input value={username} onChange={e => setUsername(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Mật khẩu</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
                    </div>
                    <button className="btn" style={{ width: '100%', marginTop: 10 }} onClick={handleLogin}>
                        ĐĂNG NHẬP HỆ THỐNG (REACT + MONGODB)
                    </button>
                </div>
            </div>
        );
    }

    const pendingCount = orders.filter(o => !o.status || o.status === 'Chờ xác nhận').length;
    const totalRev = orders.filter(o => o.status !== 'Đã hủy').reduce((s, o) => s + Number(o.total_price || 0), 0);

    return (
        <div className="admin-layout" style={{ display: 'block' }}>
            <div id="toast-container">
                {toasts.map(t => (
                    <div key={t.id} className={`toast ${t.isError ? 'error' : ''}`}>
                        <span>{t.isError ? '❌' : '✅'}</span> {t.msg}
                    </div>
                ))}
            </div>

            {confirmData && (
                <div className="modal-overlay" style={{ display: 'flex', zIndex: 30000 }}>
                    <div className="modal" style={{ maxWidth: 400, textAlign: 'center' }}>
                        <h3 style={{ marginBottom: 15, color: 'var(--primary)' }}>⚠️ Xác Nhận Xóa</h3>
                        <p style={{ marginBottom: 20, fontWeight: 600 }}>{confirmData.message}</p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                            <button className="btn" onClick={confirmData.onConfirm}>Xác nhận xóa</button>
                            <button className="btn" style={{ background: '#334155' }} onClick={() => setConfirmData(null)}>Hủy</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="admin-header">
                <div>
                    <h2 style={{ color: 'white', fontSize: 22 }}>⚡ VLSBadminton Control Panel (React + MongoDB)</h2>
                    <p style={{ color: 'var(--gray)', fontSize: 14, marginTop: 4 }}>
                        Quản lý 100+ sản phẩm trên MongoDB, % giảm giá, đơn hàng và cấu hình VietQR.
                    </p>
                </div>
                <button className="btn" style={{ background: '#334155' }} onClick={() => setLoggedIn(false)}>Đăng Xuất</button>
            </div>

            <div className="tab-nav">
                <button className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`} onClick={() => { setActiveTab('products'); loadProducts(); }}>
                    📦 Quản Lý Sản Phẩm ({products.length})
                </button>
                <button className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => { setActiveTab('orders'); loadOrders(); }}>
                    📋 Quản Lý Đơn Hàng ({orders.length})
                </button>
                <button className={`tab-btn ${activeTab === 'bank' ? 'active' : ''}`} onClick={() => { setActiveTab('bank'); loadBank(); }}>
                    🏦 Cài Đặt Ngân Hàng QR
                </button>
            </div>

            {activeTab === 'products' && (
                <div>
                    <button className="btn" style={{ background: 'var(--success)', marginBottom: 20 }}
                        onClick={() => {
                            setEditingProduct({ id: '', name: '', brand: 'Yonex', category: 'vot', price: '', sale_percent: 0, image: '', badge: '' });
                            setModalOpen(true);
                        }}>
                        + Thêm Sản Phẩm Mới
                    </button>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Hình ảnh</th>
                                <th>Tên sản phẩm</th>
                                <th>Hãng</th>
                                <th>Giá gốc</th>
                                <th>% Sale</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(p => (
                                <tr key={p.id}>
                                    <td>{p.id}</td>
                                    <td>
                                        <img src={p.image} width="44" height="44" referrerPolicy="no-referrer"
                                            onError={e => { e.target.onerror = null; e.target.src = getFallbackImg(p.category); }}
                                            style={{ objectFit: 'contain', background: '#fff', padding: 2, borderRadius: 8, border: '1px solid #334155' }} />
                                    </td>
                                    <td><strong>{p.name}</strong></td>
                                    <td>{p.brand}</td>
                                    <td>{formatMoney(p.price)} đ</td>
                                    <td>
                                        <span style={{ color: p.sale_percent > 0 ? '#f59e0b' : '#64748b', fontWeight: 'bold' }}>
                                            {p.sale_percent > 0 ? `-${p.sale_percent}%` : 'Không'}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="btn" style={{ padding: '6px 12px', background: '#f59e0b', marginRight: 6 }}
                                            onClick={() => { setEditingProduct({ ...p }); setModalOpen(true); }}>Sửa</button>
                                        <button className="btn" style={{ padding: '6px 12px', background: '#ef4444' }}
                                            onClick={() => handleDeleteProduct(p.id)}>Xóa</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'orders' && (
                <div>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <span className="stat-label">📦 Tổng Đơn Hàng</span>
                            <span className="stat-value">{orders.length}</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-label">⏳ Đơn Chờ Xử Lý</span>
                            <span className="stat-value" style={{ color: '#fbbf24' }}>{pendingCount}</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-label">💰 Tổng Doanh Thu</span>
                            <span className="stat-value" style={{ color: 'var(--success)' }}>{formatMoney(totalRev)} đ</span>
                        </div>
                    </div>

                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Mã đơn</th>
                                <th>Khách hàng & Liên hệ</th>
                                <th>Sản phẩm đặt mua</th>
                                <th>Tổng thanh toán</th>
                                <th>Trạng thái đơn</th>
                                <th>Thời gian</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(o => {
                                let items = [];
                                try { items = JSON.parse(o.items_json || '[]'); } catch (e) {}
                                const isQR = (o.address || '').includes('[Thanh toán: QR]');
                                const cleanAddress = (o.address || '').replace('[Thanh toán: QR]', '').replace('[Thanh toán: COD]', '').trim();
                                const status = o.status || 'Chờ xác nhận';

                                return (
                                    <tr key={o.id}>
                                        <td><strong>#{o.id}</strong></td>
                                        <td>
                                            <strong style={{ color: '#fff' }}>👤 {o.customer_name}</strong><br />
                                            <span style={{ color: '#38bdf8', fontWeight: 600 }}>📞 {o.phone}</span><br />
                                            <small style={{ color: '#94a3b8' }}>📍 {cleanAddress}</small>
                                        </td>
                                        <td>
                                            <div className="order-items-preview">
                                                {items.map((item, idx) => (
                                                    <div key={idx} className="mini-item">
                                                        <img src={item.image} referrerPolicy="no-referrer"
                                                            onError={e => { e.target.onerror = null; e.target.src = getFallbackImg(item.category); }} />
                                                        <div className="mini-item-info">
                                                            <div className="mini-item-name">{item.name}</div>
                                                            <div>{formatMoney(item.price)} đ <span className="mini-item-qty">x{item.qty}</span></div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ color: 'var(--primary)', fontWeight: 900, fontSize: 16 }}>{formatMoney(o.total_price)} đ</div>
                                            <span className={`pay-badge ${isQR ? 'pay-qr' : 'pay-cod'}`}>
                                                {isQR ? '🏦 Chuyển khoản QR' : '🚚 Ship COD'}
                                            </span>
                                        </td>
                                        <td>
                                            <select className="status-select" value={status} onChange={e => handleOrderStatus(o.id, e.target.value)}>
                                                <option value="Chờ xác nhận">⏳ Chờ xác nhận</option>
                                                <option value="Đang giao hàng">🚚 Đang giao hàng</option>
                                                <option value="Đã hoàn thành">✅ Đã hoàn thành</option>
                                                <option value="Đã hủy">❌ Đã hủy</option>
                                            </select>
                                        </td>
                                        <td><small style={{ color: '#94a3b8' }}>🕒 {o.created_at}</small></td>
                                        <td>
                                            <button className="btn" style={{ padding: '6px 12px', background: '#ef4444' }}
                                                onClick={() => handleDeleteOrder(o.id)}>Xóa</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'bank' && (
                <div style={{ background: 'var(--card-bg)', padding: 30, borderRadius: 16, border: '1px solid var(--border)', maxWidth: 600 }}>
                    <h3 style={{ marginBottom: 20, color: 'white' }}>⚙️ Cấu Hình Tài Khoản Nhận Tiền QR Code</h3>
                    <div className="form-group">
                        <label>Mã Ngân Hàng (VCB, MB, TCB, BIDV...)</label>
                        <input value={bank.bank_code} onChange={e => setBank({ ...bank, bank_code: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Số Tài Khoản Ngân Hàng</label>
                        <input value={bank.account_no} onChange={e => setBank({ ...bank, account_no: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Tên Chủ Tài Khoản (Không dấu)</label>
                        <input value={bank.account_name} onChange={e => setBank({ ...bank, account_name: e.target.value })} />
                    </div>
                    <button className="btn" style={{ background: 'var(--success)', width: '100%', marginTop: 10 }} onClick={handleSaveBank}>
                        LƯU CẤU HÌNH NGÂN HÀNG LÊN MONGODB
                    </button>
                </div>
            )}

            {modalOpen && editingProduct && (
                <div className="modal-overlay" style={{ display: 'flex' }}>
                    <div className="modal">
                        <h3 style={{ marginBottom: 20, color: 'white' }}>
                            {editingProduct.id ? 'Sửa Sản Phẩm & Sale' : 'Thêm Sản Phẩm Mới'}
                        </h3>
                        <div className="form-group">
                            <label>Tên sản phẩm</label>
                            <input value={editingProduct.name} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Hãng (Brand)</label>
                            <input value={editingProduct.brand} onChange={e => setEditingProduct({ ...editingProduct, brand: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Danh mục</label>
                            <select value={editingProduct.category} onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}>
                                <option value="vot">Vợt Cầu Lông</option>
                                <option value="giay">Giày Cầu Lông</option>
                                <option value="phukien">Phụ Kiện</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Giá tiền (VNĐ)</label>
                            <input type="number" value={editingProduct.price} onChange={e => setEditingProduct({ ...editingProduct, price: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>% Giảm giá Sale (0 nếu không sale)</label>
                            <input type="number" value={editingProduct.sale_percent} onChange={e => setEditingProduct({ ...editingProduct, sale_percent: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Link hình ảnh</label>
                            <input value={editingProduct.image} onChange={e => setEditingProduct({ ...editingProduct, image: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Nhãn (HOT, MỚI...)</label>
                            <input value={editingProduct.badge || ''} onChange={e => setEditingProduct({ ...editingProduct, badge: e.target.value })} />
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                            <button className="btn" style={{ flex: 1 }} onClick={handleSaveProduct}>LƯU LÊN MONGODB</button>
                            <button className="btn" style={{ flex: 1, background: '#334155' }} onClick={() => setModalOpen(false)}>HỦY BỎ</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<AdminApp />);