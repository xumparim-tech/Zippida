import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, Package, Home, Settings, Search, Check, Heart, User, Clock, Star, Tag, Filter, X, Upload, ChevronDown } from 'lucide-react';
import api from './api';

import Login from './Login';
import Register from './Register';

const App = () => {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [orders, setOrders] = useState([]);
    const [view, setView] = useState('shop');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [orderSubmitted, setOrderSubmitted] = useState(false);
    const [orderDetails, setOrderDetails] = useState({ name: '', phone: '', address: '', promoCode: '', paymentMethod: 'cash' });
    const [newProduct, setNewProduct] = useState({ name: '', category: 'non', price: '', image: '📦', stock: '', imageUrl: '' });
    const [showFilters, setShowFilters] = useState(false);
    const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
    const [stockFilter, setStockFilter] = useState('all');
    const [sortBy, setSortBy] = useState('default');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Auth State
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('userInfo')) || null);
    
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showReviews, setShowReviews] = useState(false);
    const [discount, setDiscount] = useState(0);

    const promoCodes = {
        'YANGI10': 10,
        'YOZGI20': 20,
        'VIP30': 30
    };

    const categories = [
        { id: 'all', name: 'Barchasi', icon: '📦' },
        { id: 'non', name: 'Non va pishiriq', icon: '🍞' },
        { id: 'sut', name: 'Sut mahsulotlari', icon: '🥛' },
        { id: 'meva', name: 'Meva', icon: '🍎' },
        { id: 'sabzavot', name: 'Sabzavot', icon: '🥬' },
        { id: 'don', name: 'Don mahsulotlari', icon: '🌾' },
        { id: 'boshqa', name: 'Boshqa', icon: '🛒' },
    ];

    // Initial Data Fetch
    useEffect(() => {
        fetchProducts();
        fetchOrders();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await api.get('/products');
            setProducts(res.data);
        } catch (err) {
            console.error("Error fetching products:", err);
            setError("Mahsulotlarni yuklashda xatolik!");
        } finally {
            setLoading(false);
        }
    };

    const fetchOrders = async () => {
        try {
            const token = user?.token;
            if (!token) return; // Don't fetch if no token (guest)

            const { data } = await api.get('/orders', {
                headers: { Authorization: `Bearer ${token}` } 
            });
            console.log("Orders fetched:", data);
            setOrders(data);
        } catch (err) {
            console.error("Error fetching orders:", err);
            // Don't show error to user constantly, just log it
        }
    };

    const addToCart = (product) => {
        const existing = cart.find(item => item.id === product.id);
        if (existing) {
            setCart(cart.map(item =>
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setCart([...cart, { ...product, quantity: 1 }]);
        }
    };

    const updateQuantity = (id, delta) => {
        const item = cart.find(item => item.id === id);
        if (item && item.quantity + delta <= 0) {
            setCart(cart.filter(item => item.id !== id));
        } else {
            setCart(cart.map(item => {
                if (item.id === id) {
                    return { ...item, quantity: item.quantity + delta };
                }
                return item;
            }));
        }
    };

    const removeFromCart = (id) => {
        setCart(cart.filter(item => item.id !== id));
    };

    const toggleFavorite = (productId) => {
        if (favorites.includes(productId)) {
            setFavorites(favorites.filter(id => id !== productId));
        } else {
            setFavorites([...favorites, productId]);
        }
    };

    const applyPromoCode = () => {
        const code = orderDetails.promoCode.toUpperCase();
        if (promoCodes[code]) {
            setDiscount(promoCodes[code]);
            setError('');
        } else if (code) {
            setError('Promokod noto\'g\'ri!');
            setDiscount(0);
        } else {
            setDiscount(0);
            setError('');
        }
    };

    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = totalPrice > 50000 ? 0 : 10000;
    const discountAmount = (totalPrice * discount) / 100;
    const finalTotal = totalPrice + deliveryFee - discountAmount;

    const filteredProducts = products.filter(p => {
        const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
        const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchPrice = p.price >= priceRange.min && p.price <= priceRange.max;
        const matchStock = stockFilter === 'all' ||
            (stockFilter === 'available' && p.stock > 0) ||
            (stockFilter === 'low' && p.stock > 0 && p.stock < 20);
        return matchCategory && matchSearch && matchPrice && matchStock;
    });

    const sortedProducts = [...filteredProducts].sort((a, b) => {
        if (sortBy === 'price-low') return a.price - b.price;
        if (sortBy === 'price-high') return b.price - a.price;
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'popular') return b.reviews - a.reviews;
        return 0;
    });

    const handleOrderSubmit = async () => {
        if (!orderDetails.name || !orderDetails.phone || !orderDetails.address) {
            setError('Barcha maydonlarni to\'ldiring!');
            return;
        }
        if (cart.length === 0) {
            setError('Savat bo\'sh!');
            return;
        }

        if (orderDetails.paymentMethod === 'card') {
            const confirmPayment = window.confirm(`Jami: ${finalTotal.toLocaleString()} so'm. \nTo'lovni tasdiqlaysizmi? (Kartadan yechiladi)`);
            if (!confirmPayment) return;
        }

        const newOrder = {
            items: cart,
            total: finalTotal,
            details: orderDetails,
            status: 'Jarayonda',
            date: new Date().toLocaleString()
        };

        setLoading(true);
        try {
            const token = user?.token;
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            
            await api.post('/orders', newOrder, { headers });
            setCart([]);
            setOrderSubmitted(true);
            setTimeout(() => {
                setOrderSubmitted(false);
                setView('shop');
                fetchOrders();
            }, 3000);
        } catch (err) {
            console.error(err);
            setError('Buyurtma berishda xatolik!');
        } finally {
            setLoading(false);
        }
    };

    const quickOrder = (product) => {
        if (!user.phone) {
            setError('Telefon raqamingizni kiriting!');
            return;
        }
        addToCart(product);
        setView('cart');
    };

    const addProduct = async () => {
        if (!newProduct.name || !newProduct.price || !newProduct.stock) {
            setError('Barcha maydonlarni to\'ldiring!');
            return;
        }
        setLoading(true);
        try {
            const productPayload = {
                name: newProduct.name,
                category: newProduct.category,
                price: parseInt(newProduct.price),
                image: newProduct.image,
                stock: parseInt(newProduct.stock),
                imageUrl: newProduct.imageUrl
            };

            const token = user?.token;
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            const res = await api.post('/products', productPayload, config);
            setProducts([...products, res.data]);
            setNewProduct({ name: '', category: 'non', price: '', image: '📦', stock: '', imageUrl: '' });
            setError('');
        } catch (err) {
            console.error(err);
            setError("Mahsulot qo'shishda xatolik!");
        } finally {
            setLoading(false);
        }
    };

    const deleteProduct = async (id) => {
        try {
            const token = user?.token;
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };
            await api.delete(`/products/${id}`, config);
            setProducts(products.filter(p => p.id !== id));
        } catch (err) {
            console.error(err);
            setError("O'chirishda xatolik!");
        }
    };

    const handleLogin = async (phone, password, setErrorCb) => {
        setLoading(true);
        try {
            const { data } = await api.post('/users/login', { phone, password });
            localStorage.setItem('userInfo', JSON.stringify(data));
            setUser(data);
            setView('shop');
        } catch (err) {
            setErrorCb(err.response?.data?.message || 'Kirishda xatolik');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (name, phone, password, setErrorCb) => {
        setLoading(true);
        try {
            const { data } = await api.post('/users/register', { name, phone, password });
            localStorage.setItem('userInfo', JSON.stringify(data));
            setUser(data);
            setView('shop');
        } catch (err) {
            setErrorCb(err.response?.data?.message || 'Ro\'yxatdan o\'tishda xatolik');
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('userInfo');
        setUser(null);
        setView('shop');
        setCart([]);
    };

    const handleImageUpload = (e, isAdmin = false) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (isAdmin) {
                    setNewProduct({ ...newProduct, imageUrl: event.target.result });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const renderStars = (rating) => {
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                    <Star
                        key={star}
                        className={`w-4 h-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                ))}
                <span className="text-sm text-gray-600 ml-1">{rating}</span>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
            {loading && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-xl">
                        <div className="animate-spin w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
                        <p className="mt-4 text-gray-600">Yuklanmoqda...</p>
                    </div>
                </div>
            )}

            {error && (
                <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce">
                    <div className="flex items-center gap-2">
                        <X className="w-5 h-5" />
                        <span>{error}</span>
                        <button onClick={() => setError('')} className="ml-2 hover:text-gray-200">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            <header className="bg-gradient-to-r from-purple-600 to-pink-600 text-white sticky top-0 z-40 shadow-lg">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setView('shop')} className="focus:outline-none">
                                <img src="/logo.png" alt="Zippida" className="h-28 md:h-36 w-auto object-contain transition-transform hover:scale-105" />
                            </button>
                        </div>
                        <div className="flex gap-2 items-center">
                            <button onClick={() => setView('shop')} className={`p-2 rounded-lg transition ${view === 'shop' ? 'bg-white text-purple-600' : 'bg-purple-700 hover:bg-purple-800'}`}><Home className="w-5 h-5" /></button>
                            
                            {user ? (
                                <>
                                    <button onClick={() => setView('favorites')} className={`p-2 rounded-lg transition relative ${view === 'favorites' ? 'bg-white text-purple-600' : 'bg-purple-700 hover:bg-purple-800'}`}>
                                        <Heart className={`w-5 h-5 ${favorites.length > 0 ? 'fill-current' : ''}`} />
                                        {favorites.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{favorites.length}</span>}
                                    </button>
                                    <button onClick={() => setView('cart')} className={`p-2 rounded-lg transition relative ${view === 'cart' ? 'bg-white text-purple-600' : 'bg-purple-700 hover:bg-purple-800'}`}>
                                        <ShoppingCart className="w-5 h-5" />
                                        {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{cart.length}</span>}
                                    </button>
                                    <button onClick={() => setView('orders')} className={`p-2 rounded-lg transition relative ${view === 'orders' ? 'bg-white text-purple-600' : 'bg-purple-700 hover:bg-purple-800'}`}>
                                        <Clock className="w-5 h-5" />
                                        {orders.length > 0 && <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{orders.length}</span>}
                                    </button>
                                    {user.isAdmin && (
                                        <button onClick={() => setView('admin')} className={`p-2 rounded-lg transition ${view === 'admin' ? 'bg-white text-purple-600' : 'bg-purple-700 hover:bg-purple-800'}`}><Settings className="w-5 h-5" /></button>
                                    )}
                                    <button onClick={logout} className="ml-2 bg-white text-red-500 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-gray-100">Chiqish</button>
                                </>
                            ) : (
                                <button onClick={() => setView('login')} className="bg-white text-purple-600 px-4 py-2 rounded-lg font-bold hover:bg-gray-100">Kirish</button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {view === 'shop' && (
                <div className="container mx-auto px-4 py-4 md:py-6">
                    <div className="mb-4 md:mb-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Mahsulot qidirish..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 items-center mb-4 overflow-x-auto pb-2">
                        <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-purple-600 text-purple-600 rounded-full whitespace-nowrap hover:bg-purple-50">
                            <Filter className="w-4 h-4" /> Filtr
                        </button>
                        {categories.map(cat => (
                            <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition ${selectedCategory === cat.id ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>
                                <span>{cat.icon}</span> <span className="hidden md:inline">{cat.name}</span>
                            </button>
                        ))}
                    </div>

                    {showFilters && (
                        <div className="bg-white p-4 rounded-xl shadow-lg mb-4">
                           <div className="grid md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Narx oralig'i</label>
                                    <div className="flex gap-2">
                                        <input type="number" placeholder="Min" value={priceRange.min} onChange={(e) => setPriceRange({ ...priceRange, min: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg" />
                                        <input type="number" placeholder="Max" value={priceRange.max} onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) || 100000 })} className="w-full px-3 py-2 border rounded-lg" />
                                    </div>
                                </div>
                           </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                        {sortedProducts.map(product => (
                            <div key={product.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition relative group">
                                <button onClick={() => toggleFavorite(product.id)} className="absolute top-2 right-2 z-10 bg-white p-2 rounded-full shadow-md hover:scale-110 transition opacity-0 group-hover:opacity-100">
                                    <Heart className={`w-5 h-5 ${favorites.includes(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                                </button>
                                <div className="text-4xl md:text-6xl text-center py-4 md:py-6 bg-gradient-to-br from-purple-50 to-pink-50 cursor-pointer" onClick={() => { setSelectedProduct(product); setShowReviews(true); }}>
                                    {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="w-full h-32 md:h-40 object-cover" /> : product.image}
                                </div>
                                <div className="p-3 md:p-4">
                                    <h3 className="font-semibold text-sm md:text-lg mb-1 truncate">{product.name}</h3>
                                    <div className="flex items-center justify-between mb-2">
                                        {renderStars(product.rating)}
                                        <span className="text-xs text-gray-500">({product.reviews})</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex-1">
                                            <span className="text-lg md:text-xl font-bold text-purple-600 block">{product.price.toLocaleString()}</span>
                                            <span className="text-xs text-gray-500">so'm</span>
                                        </div>
                                        {cart.find(item => item.id === product.id) ? (
                                            <div className="flex items-center gap-1 bg-purple-600 text-white rounded-lg px-2 py-1">
                                                <button onClick={() => updateQuantity(product.id, -1)} className="hover:bg-purple-700 p-1 rounded"><Minus className="w-3 h-3 md:w-4 md:h-4" /></button>
                                                <span className="font-bold min-w-[20px] text-center text-sm">{cart.find(item => item.id === product.id).quantity}</span>
                                                <button onClick={() => updateQuantity(product.id, 1)} className="hover:bg-purple-700 p-1 rounded"><Plus className="w-3 h-3 md:w-4 md:h-4" /></button>
                                            </div>
                                        ) : (
                                            <button onClick={() => addToCart(product)} className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 transition"><Plus className="w-4 h-4 md:w-5 md:h-5" /></button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {view === 'filters' && (<div>Filters...</div>)} {/* Placeholder if needed */}
            
            {view === 'favorites' && (
                <div className="container mx-auto px-4 py-6">
                    <h2 className="text-2xl font-bold mb-4">Sevimlilar</h2>
                     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {products.filter(p => favorites.includes(p.id)).map(product => (
                            <div key={product.id} className="bg-white rounded-xl shadow-md p-4">
                                <h3 className="font-bold">{product.name}</h3>
                                <p>{product.price.toLocaleString()} so'm</p>
                                <button onClick={() => addToCart(product)} className="mt-2 text-purple-600">Savatga</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {view === 'cart' && (
                <div className="container mx-auto px-4 py-6">
                     {/* Cart Implementation (Simplified for brevity, but logic is there) */}
                     <h2 className="text-2xl font-bold mb-4">Savat</h2>
                     {cart.length === 0 ? <p>Savat bo'sh</p> : (
                         <div className="grid lg:grid-cols-3 gap-6">
                             <div className="lg:col-span-2 bg-white rounded-xl shadow p-6">
                                 {cart.map(item => (
                                     <div key={item.id} className="flex justify-between items-center border-b py-2">
                                         <div>{item.name} x {item.quantity}</div>
                                         <div>{(item.price * item.quantity).toLocaleString()} so'm</div>
                                     </div>
                                 ))}
                             </div>
                             <div className="bg-white rounded-xl shadow p-6 h-fit">
                                 <h3 className="font-bold mb-4">Jami: {finalTotal.toLocaleString()} so'm</h3>
                                 <input type="text" placeholder="Ism" className="w-full border p-2 rounded mb-2" value={orderDetails.name} onChange={e => setOrderDetails({...orderDetails, name: e.target.value})} />
                                 <input type="text" placeholder="Tel" className="w-full border p-2 rounded mb-2" value={orderDetails.phone} onChange={e => setOrderDetails({...orderDetails, phone: e.target.value})} />
                                 <input type="text" placeholder="Manzil" className="w-full border p-2 rounded mb-2" value={orderDetails.address} onChange={e => setOrderDetails({...orderDetails, address: e.target.value})} />
                                 
                                 <div className="mb-4">
                                     <label className="block font-semibold mb-2">To'lov turi:</label>
                                     <div className="flex gap-4">
                                         <label className="flex items-center gap-2 cursor-pointer">
                                             <input type="radio" name="payment" checked={orderDetails.paymentMethod === 'cash'} onChange={() => setOrderDetails({...orderDetails, paymentMethod: 'cash'})} />
                                             <span>Naqd</span>
                                         </label>
                                         <label className="flex items-center gap-2 cursor-pointer">
                                             <input type="radio" name="payment" checked={orderDetails.paymentMethod === 'card'} onChange={() => setOrderDetails({...orderDetails, paymentMethod: 'card'})} />
                                             <span>Plastik karta (Click/Payme)</span>
                                         </label>
                                     </div>
                                 </div>
                                 
                                 <button onClick={handleOrderSubmit} className="w-full bg-purple-600 text-white py-2 rounded font-bold hover:bg-purple-700 transition">
                                     {orderDetails.paymentMethod === 'card' ? "To'lash va Buyurtma berish" : "Buyurtma berish"}
                                 </button>
                             </div>
                         </div>
                     )}
                </div>
            )}

            {view === 'orders' && (
                <div className="container mx-auto px-4 py-6">
                    <h2 className="text-2xl font-bold mb-4">Buyurtmalar</h2>
                    {orders.map(order => (
                        <div key={order.id} className="bg-white rounded-xl shadow p-4 mb-4">
                            <div className="flex justify-between font-bold">
                                <span>Buyurtma #{order.id}</span>
                                <span>{order.total.toLocaleString()} so'm</span>
                            </div>
                            <div className="text-sm text-gray-500">{order.status}</div>
                        </div>
                    ))}
                </div>
            )}

            {view === 'admin' && user?.isAdmin && (
                <div className="container mx-auto px-4 py-6">
                    <h2 className="text-2xl font-bold mb-4">Admin Panel</h2>
                    
                    <div className="bg-white rounded-xl shadow p-6 mb-6">
                        <h3 className="font-bold mb-3">Yangi mahsulot qo'shish</h3>
                        <div className="grid gap-4">
                            <input type="text" placeholder="Nomi" className="border p-2 rounded" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                            <input type="number" placeholder="Narxi" className="border p-2 rounded" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
                            <input type="number" placeholder="Omborda" className="border p-2 rounded" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} />
                            <select className="border p-2 rounded" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <input type="text" placeholder="Rasm URL (ixtiyoriy)" className="border p-2 rounded" value={newProduct.imageUrl} onChange={e => setNewProduct({...newProduct, imageUrl: e.target.value})} />
                            <button onClick={addProduct} className="bg-green-600 text-white py-2 rounded">Qo'shish</button>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow p-6">
                        <h3 className="font-bold mb-3">Buyurtmalar boshqaruvi</h3>
                        {orders.map(order => (
                            <div key={order._id || order.id} className="border-b py-4 last:border-0">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <strong>Buyurtma:</strong> {order._id || order.id} <br/>
                                        <span className="text-sm text-gray-500">{order.date}</span>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-sm ${
                                        order.status === 'Yetkazildi' ? 'bg-green-100 text-green-700' : 
                                        order.status === 'Bekor qilindi' ? 'bg-red-100 text-red-700' : 
                                        'bg-yellow-100 text-yellow-700'
                                    }`}>{order.status}</span>
                                </div>
                                <div className="text-sm mb-2">
                                    <strong>Mijoz:</strong> {order.details.name} ({order.details.phone}) <br/>
                                    <strong>Manzil:</strong> {order.details.address}
                                </div>
                                <div className="mb-2">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="text-sm text-gray-600">
                                            {item.name} x {item.quantity}
                                        </div>
                                    ))}
                                </div>
                                <div className="font-bold mb-2">Jami: {order.total.toLocaleString()} so'm</div>
                                <div className="flex gap-2">
                                    <button onClick={async () => {
                                        try {
                                            const token = JSON.parse(localStorage.getItem('userInfo')).token;
                                            await api.put(`/orders/${order._id || order.id}`, { status: 'Yetkazildi' }, { headers: { Authorization: `Bearer ${token}` } });
                                            fetchOrders();
                                        } catch (e) { alert('Xatolik'); }
                                    }} className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600">Yetkazildi</button>
                                    
                                    <button onClick={async () => {
                                        try {
                                            const token = JSON.parse(localStorage.getItem('userInfo')).token;
                                            await api.put(`/orders/${order._id || order.id}`, { status: 'Bekor qilindi' }, { headers: { Authorization: `Bearer ${token}` } });
                                            fetchOrders();
                                        } catch (e) { alert('Xatolik'); }
                                    }} className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600">Bekor qilish</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {view === 'login' && <Login onLogin={handleLogin} switchToRegister={() => setView('register')} />}
            {view === 'register' && <Register onRegister={handleRegister} switchToLogin={() => setView('login')} />}
        </div>
    );
};

export default App;
