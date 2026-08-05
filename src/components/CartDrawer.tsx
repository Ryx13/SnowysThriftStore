import { useState } from 'react';
import { useCart } from '../lib/CartContext';
import { X, Trash2, ShoppingBag } from 'lucide-react';
import CheckoutModal from './CheckoutModal';

export default function CartDrawer({ onClose }: { onClose: () => void }) {
  const { items, removeItem, subtotal } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-white z-50 shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-bold text-base flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" /> Your Cart ({items.length})
          </h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-12">Your cart is empty.</p>
          ) : (
            items.map((item) => (
              <div key={item.productId} className="flex gap-3 border-b pb-3">
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {item.coverImage && (
                    <img src={item.coverImage} alt={item.title} className="max-w-full max-h-full object-contain" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{item.title}</p>
                  <p className="text-xs text-gray-500">
                    Size: {item.standardSize} (SA {item.saSize}) · {item.condition}
                  </p>
                  <p className="text-sm font-bold mt-1">R{item.price.toFixed(2)}</p>
                </div>
                <button onClick={() => removeItem(item.productId)} className="text-gray-400 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-4 border-t space-y-3">
            <div className="flex justify-between text-sm font-bold">
              <span>Subtotal</span>
              <span>R{subtotal.toFixed(2)}</span>
            </div>
            <p className="text-[11px] text-gray-500">Delivery fee excluded — confirmed with the seller before dispatch.</p>
            <button
              onClick={() => setShowCheckout(true)}
              className="w-full bg-black text-white py-2.5 rounded-lg font-medium text-sm hover:bg-gray-800 transition-colors"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>

      {showCheckout && (
        <CheckoutModal
          onClose={() => {
            setShowCheckout(false);
            onClose();
          }}
        />
      )}
    </>
  );
}