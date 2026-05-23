const BaseChannel = require('../BaseChannel');
const axios = require('axios');

class GrabFoodChannel extends BaseChannel {
  async syncStock(itemCode, newStock) {
    console.log(`📡 [GrabFood] Syncing stock for ${itemCode} -> ${newStock}`);
    // Real API call would happen here using axios
    // const res = await axios.post(this.config.apiUrl, { ... });
    return { success: true, channel: 'grabfood' };
  }

  async transformOrder(rawOrder) {
    // Mengubah format unik Grab ke format standar KEN Enterprise
    return {
      source: 'grabfood',
      customer_name: rawOrder.customer?.name || 'Grab Customer',
      items: rawOrder.cart?.items.map(i => ({
        id: i.ext_id,
        name: i.name,
        qty: i.quantity,
        price: i.price
      })),
      total: rawOrder.payment?.amount || 0
    };
  }

  async updateOrderStatus(orderId, status) {
    console.log(`📡 [GrabFood] Updating order ${orderId} to ${status}`);
  }
}

module.exports = GrabFoodChannel;
