import type { CartItem } from './CartContext';

interface BuyerCheckoutDetails {
  fullName: string;
  phone: string;
  paxiStoreNameOrCode: string;
  destinationCity: string;
}

export function generateWhatsAppCheckoutUrl(
  sellerPhone: string,
  items: CartItem[],
  buyer: BuyerCheckoutDetails,
  subtotal: number
): string {
  const itemLines = items
    .map(
      (item, index) =>
        `${index + 1}. *${item.title}* - Size: ${item.standardSize} (SA ${item.saSize}) - ${item.condition} (R${item.price.toFixed(2)})`
    )
    .join('\n');

  const rawMessage = `🛍️ *NEW ORDER REQUEST - Snowy's Thrift Store*
----------------------------------
*Items Ordered:*
${itemLines}

*Subtotal (Excl. Delivery):* R${subtotal.toFixed(2)}
----------------------------------
👤 *Buyer Details:*
• Name: ${buyer.fullName}
• Contact: ${buyer.phone}
• PAXI Destination: ${buyer.paxiStoreNameOrCode} (${buyer.destinationCity})
----------------------------------
📌 *Note:* Delivery fee is not included above and will be confirmed based on PAXI bag size. Full payment (items + delivery) must clear before dispatch.`;

  return `https://wa.me/${sellerPhone}?text=${encodeURIComponent(rawMessage)}`;
}