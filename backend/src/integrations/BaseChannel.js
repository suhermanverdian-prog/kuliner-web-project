/**
 * @class BaseChannel
 * @description Kontrak Standar untuk semua Integrasi Marketplace
 * Semua modul marketplace (Shopee, Grab, dll) WAJIB mewarisi kelas ini.
 */
class BaseChannel {
  constructor(tenantId, config = {}) {
    this.tenantId = tenantId;
    this.config = config;
  }

  // Setiap kanal harus bisa sinkronisasi stok
  async syncStock(itemCode, newStock) {
    throw new Error('Method syncStock() must be implemented');
  }

  // Setiap kanal harus bisa memproses pesanan masuk
  async transformOrder(rawOrder) {
    throw new Error('Method transformOrder() must be implemented');
  }

  // Setiap kanal harus bisa update status pesanan
  async updateOrderStatus(orderId, status) {
    throw new Error('Method updateOrderStatus() must be implemented');
  }
}

module.exports = BaseChannel;
