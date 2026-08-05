import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { useCart } from '../lib/CartContext';
import { generateWhatsAppCheckoutUrl } from '../lib/whatsapp';
import { X, MessageCircle, AlertTriangle } from 'lucide-react';

const SELLER_WHATSAPP_NUMBER = import.meta.env.VITE_SELLER_WHATSAPP_NUMBER as string;

export default function CheckoutModal({ onClose }: { onClose: () => void }) {
  const { user, profile } = useAuth();
  const { items, subtotal, clearCart } = useCart();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone_number || '');
  const [paxiStore, setPaxiStore] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleConfirmOrder() {
    setError('');

    if (!user) {
      setError('Please sign in first so we can save a copy of your order to your account.');
      return;
    }
    if (!fullName || !phone || !paxiStore || !destinationCity) {
      setError('Please fill in all delivery details.');
      return;
    }
    if (!agreed) {
      setError('Please confirm you understand the delivery and payment terms.');
      return;
    }
    if (!SELLER_WHATSAPP_NUMBER) {
      setError('Store WhatsApp number is not configured yet. Please contact the site owner.');
      return;
    }

    setLoading(true);
    try {
      const orderSummaryText = items
        .map((i) => `${i.title} (${i.standardSize}/SA ${i.saSize}) - R${i.price.toFixed(2)}`)
        .join(', ');

      const { data: thread, error: threadError } = await supabase
        .from('chat_threads')
        .insert([
          {
            buyer_id: user.id,
            order_summary: orderSummaryText,
            items: items,
            subtotal: subtotal,
            delivery_destination: `${paxiStore}, ${destinationCity}`,
            paxi_store_code: paxiStore,
            status: 'pending',
          },
        ])
        .select()
        .single();

      if (threadError) throw threadError;

      const whatsappUrl = generateWhatsAppCheckoutUrl(
        SELLER_WHATSAPP_NUMBER,
        items,
        { fullName, phone, paxiStoreNameOrCode: paxiStore, destinationCity },
        subtotal
      );

      const messageBody = `New order placed:\n${orderSummaryText}\n\nSubtotal: R${subtotal.toFixed(
        2
      )}\nDelivery to: ${paxiStore}, ${destinationCity}\nContact: ${phone}\n\nNote: Delivery fee excluded, to be confirmed. Funds must clear before dispatch.`;

      const { error: messageError } = await supabase.from('chat_messages').insert([
        { thread_id: thread.id, sender_id: user.id, message_body: messageBody },
      ]);

      if (messageError) throw messageError;

      window.open(whatsappUrl, '_blank');

      clearCart();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong placing your order.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-bold text-base">Confirm Your Order</h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="space-y-1 text-sm">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between">
                <span className="truncate pr-2">
                  {item.title} ({item.standardSize})
                </span>
                <span className="font-semibold whitespace-nowrap">R{item.price.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2 border-t font-bold">
              <span>Subtotal</span>
              <span>R{subtotal.toFixed(2)}</span>
            </div>
          </div>

          {!user && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              You need to sign in before placing an order, so we can save it to your account and keep the chat linked to you.
            </div>
          )}

          <div className="space-y-2">
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-black"
            />
            <input
              type="tel"
              placeholder="Contact Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-black"
            />
            <input
              type="text"
              placeholder="Nearest PEP / PAXI Store Name or Code"
              value={paxiStore}
              onChange={(e) => setPaxiStore(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-black"
            />
            <input
              type="text"
              placeholder="Destination City / Town"
              value={destinationCity}
              onChange={(e) => setDestinationCity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-black"
            />
          </div>

          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-gray-900">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Delivery & Payment Disclaimer
            </div>
            <p>1. Delivery via PEP PAXI is calculated separately based on parcel size and location — it is NOT included in the subtotal above.</p>
            <p>2. The price shown at checkout is not final until the delivery fee is agreed with the seller via WhatsApp/chat.</p>
            <p>3. Full payment (items + delivery) must reflect before any item is packaged and shipped.</p>
            <p>4. Clicking below opens WhatsApp with your order pre-filled, and also saves a copy of this order to your Snowy's Thrift Store account so you can chat with us here too.</p>
          </div>

          <label className="flex items-start gap-2 text-xs">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5" />
            <span>I understand and agree to the delivery and payment terms above.</span>
          </label>

          {error && <div className="p-2 bg-red-50 text-red-800 text-xs rounded-lg border border-red-200">{error}</div>}

          <button
            onClick={handleConfirmOrder}
            disabled={loading}
            className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            {loading ? 'Placing Order...' : `Continue on WhatsApp (R${subtotal.toFixed(2)} + Delivery)`}
          </button>
        </div>
      </div>
    </div>
  );
}