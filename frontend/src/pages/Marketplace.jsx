import { useEffect, useState } from 'react';
import api from '../api';

export default function Marketplace() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [alert, setAlert] = useState('');
  const [orderForm, setOrderForm] = useState({
    quantity: 1,
    delivery_name: '',
    delivery_phone: '',
    delivery_address: '',
    payment_method: 'cod',
    transaction_id: '',
  });

  const loadProducts = async () => {
    try {
      const res = await api.get('/market/products');
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setAlert('Failed to load marketplace.');
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const submitOrder = async (e) => {
    e.preventDefault();

    try {
      await api.post('/market/orders', {
        product_id: selectedProduct.product_id,
        ...orderForm,
        quantity: Number(orderForm.quantity),
      });

      setAlert('Order placed successfully.');
      setSelectedProduct(null);
      setOrderForm({
        quantity: 1,
        delivery_name: '',
        delivery_phone: '',
        delivery_address: '',
        payment_method: 'cod',
        transaction_id: '',
      });
      loadProducts();
    } catch (err) {
      console.error(err);
      setAlert(err.response?.data?.message || 'Failed to place order.');
    }
  };

  return (
    <div className="page-wrapper">
      <div className="main-content">
        <h1>Marketplace</h1>

        {alert && <div className="alert alert-success">{alert}</div>}

        {products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🛍️</div>
            <div className="empty-title">No products found</div>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '16px',
            }}
          >
            {products.map((p) => (
              <div
                key={p.product_id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '14px',
                }}
              >
                {p.image && (
                  <img
                    src={p.image}
                    alt={p.name}
                    style={{
                      width: '100%',
                      height: '160px',
                      objectFit: 'cover',
                      borderRadius: '10px',
                      marginBottom: '10px',
                    }}
                  />
                )}

                <h3>{p.name}</h3>
                <p>{p.description || 'No description'}</p>
                <p>Seller: {p.owner_name}</p>
                {p.event_title && <p>Concert: {p.event_title}</p>}
                <p>৳{p.price}</p>
                <p>Stock: {p.stock}</p>

                <button
                  className="btn btn-primary btn-sm"
                  disabled={p.stock <= 0}
                  onClick={() => setSelectedProduct(p)}
                >
                  {p.stock <= 0 ? 'Out of Stock' : 'Order Now'}
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedProduct && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
            }}
          >
            <form
              onSubmit={submitOrder}
              style={{
                width: '90%',
                maxWidth: '500px',
                background: 'var(--bg-card)',
                padding: '20px',
                borderRadius: '14px',
              }}
            >
              <h2>Order {selectedProduct.name}</h2>

              <input
                className="form-control"
                type="number"
                min="1"
                max={selectedProduct.stock}
                value={orderForm.quantity}
                onChange={(e) =>
                  setOrderForm({ ...orderForm, quantity: e.target.value })
                }
                placeholder="Quantity"
              />

              <input
                className="form-control"
                value={orderForm.delivery_name}
                onChange={(e) =>
                  setOrderForm({ ...orderForm, delivery_name: e.target.value })
                }
                placeholder="Receiver name"
              />

              <input
                className="form-control"
                value={orderForm.delivery_phone}
                onChange={(e) =>
                  setOrderForm({ ...orderForm, delivery_phone: e.target.value })
                }
                placeholder="Phone number"
              />

              <textarea
                className="form-control"
                value={orderForm.delivery_address}
                onChange={(e) =>
                  setOrderForm({ ...orderForm, delivery_address: e.target.value })
                }
                placeholder="Delivery location"
              />

              <select
                className="form-control"
                value={orderForm.payment_method}
                onChange={(e) =>
                  setOrderForm({ ...orderForm, payment_method: e.target.value })
                }
              >
                <option value="cod">Cash on Delivery</option>
                <option value="bkash">bKash</option>
                <option value="nagad">Nagad</option>
                <option value="card">Card</option>
              </select>

              {orderForm.payment_method !== 'cod' && (
                <input
                  className="form-control"
                  value={orderForm.transaction_id}
                  onChange={(e) =>
                    setOrderForm({ ...orderForm, transaction_id: e.target.value })
                  }
                  placeholder="Transaction ID"
                />
              )}

              <button className="btn btn-primary" type="submit">
                Confirm Order
              </button>

              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => setSelectedProduct(null)}
              >
                Cancel
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
