import type { Metadata } from 'next';
import CartView from './CartView';

export const metadata: Metadata = { title: 'My Cart' };

export default function CartPage() {
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Cart</h1>
          <p className="page-subtitle">Review items and place your order</p>
        </div>
      </div>
      <CartView />
    </div>
  );
}
