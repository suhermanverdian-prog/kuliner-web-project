const CorporateRepository = require('../repositories/corporateRepository');

class CorporateService {
  async getPartners(tenantId) {
    if (!tenantId) throw new Error('Tenant ID required');
    return await CorporateRepository.getPartners(tenantId);
  }

  async getPartnerById(id, tenantId) {
    if (!tenantId) throw new Error('Tenant ID required');
    return await CorporateRepository.getPartnerById(id, tenantId);
  }

  async createPartner(tenantId, partnerData) {
    if (!tenantId) throw new Error('Tenant ID required');
    if (!partnerData.company_name) throw new Error('Nama perusahaan wajib diisi');
    if (!partnerData.billing_email) throw new Error('Email penagihan wajib diisi');
    return await CorporateRepository.createPartner(tenantId, partnerData);
  }

  async updatePartner(id, tenantId, partnerData) {
    if (!tenantId) throw new Error('Tenant ID required');
    return await CorporateRepository.updatePartner(id, tenantId, partnerData);
  }

  async deletePartner(id, tenantId) {
    if (!tenantId) throw new Error('Tenant ID required');
    return await CorporateRepository.softDeletePartner(id, tenantId);
  }
}

module.exports = new CorporateService();
