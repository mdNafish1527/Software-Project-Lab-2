import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';

export default function AddProduct() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('event_id');

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    image: '',
  });

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('error');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === 'image' && files && files[0]) {
      const reader = new FileReader();

      reader.onloadend = () => {
        setForm((prev) => ({
          ...prev,
          image: reader.result,
        }));
      };

      reader.readAsDataURL(files[0]);
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submitProduct = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!form.name.trim()) {
      setMessageType('error');
      setMessage('Product name is required.');
      return;
    }

    if (!form.price || Number(form.price) <= 0) {
      setMessageType('error');
      setMessage('Valid product price is required.');
      return;
    }

    if (form.stock && Number(form.stock) < 0) {
      setMessageType('error');
      setMessage('Stock quantity cannot be negative.');
      return;
    }

    try {
      setLoading(true);

      await api.post('/market/products', {
        event_id: eventId || null,
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        stock: Number(form.stock || 0),
        image: form.image || null,
      });

      setMessageType('success');
      setMessage(eventId ? 'Concert product added successfully.' : 'Product added successfully.');

      setTimeout(() => {
        navigate('/marketplace');
      }, 800);
    } catch (err) {
      console.error('Add product error:', err);
      setMessageType('error');
      setMessage(err.response?.data?.message || 'Failed to add product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="main-content">
        <h1>{eventId ? 'Add Concert Product' : 'Add Marketplace Product'}</h1>

        {eventId && (
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
            This product will be dedicated to concert ID: {eventId}
          </p>
        )}

        {message && (
          <div
            className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`}
            style={{ marginBottom: '16px' }}
          >
            {message}
          </div>
        )}

        <form
          onSubmit={submitProduct}
          style={{
            maxWidth: '600px',
            background: 'var(--bg-card)',
            padding: '20px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <input
            className="form-control"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Product name e.g. Concert T-shirt, Cap, Guitar"
            style={{ marginBottom: '12px' }}
          />

          <textarea
            className="form-control"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Product description"
            style={{ marginBottom: '12px', minHeight: '90px' }}
          />

          <input
            className="form-control"
            name="price"
            type="number"
            min="1"
            step="0.01"
            value={form.price}
            onChange={handleChange}
            placeholder="Price"
            style={{ marginBottom: '12px' }}
          />

          <input
            className="form-control"
            name="stock"
            type="number"
            min="0"
            value={form.stock}
            onChange={handleChange}
            placeholder="Stock quantity"
            style={{ marginBottom: '12px' }}
          />

          <input
            className="form-control"
            name="image"
            type="file"
            accept="image/*"
            onChange={handleChange}
            style={{ marginBottom: '12px' }}
          />

          {form.image && (
            <img
              src={form.image}
              alt="Preview"
              style={{
                width: '160px',
                height: '120px',
                objectFit: 'cover',
                borderRadius: '10px',
                marginBottom: '12px',
                display: 'block',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            />
          )}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Adding...' : 'Add Product'}
          </button>
        </form>
      </div>
    </div>
  );
}