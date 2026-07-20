import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrder } from '../api/orders';
import OrderForm from '../components/orders/OrderForm';

export default function NewOrder() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: Record<string, unknown>) => {
    setLoading(true);
    try {
      const order = await createOrder(data);
      navigate(`/orders/${order._id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
        <OrderForm onSubmit={handleSubmit} onCancel={() => navigate('/orders')} loading={loading} />
      </div>
    </div>
  );
}
