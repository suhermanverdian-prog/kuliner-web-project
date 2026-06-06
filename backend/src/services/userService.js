const UserRepository = require('../repositories/userRepository');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class UserService {
  async login(loginIdentifier, password) {
    // 1. FAST-PATH: SuperAdmin Identification
    if (loginIdentifier === 'superadmin') {
      const { data: master } = await UserRepository.getSuperAdmin();
      
      const isPasswordValid = 
        (master && master.password && bcrypt.compareSync(password, master.password)) ||
        (process.env.SUPERADMIN_PASSWORD && password === process.env.SUPERADMIN_PASSWORD);
        
      if (isPasswordValid) {
        return {
          user: { ...(master || {}), id: master ? master.id : '00000000-0000-0000-0000-000000000000', username: 'superadmin', role: 'superadmin', tenant_id: '00000000-0000-0000-0000-000000000000' },
          tenant: { id: '00000000-0000-0000-0000-000000000000', name: 'KEN GLOBAL HQ' },
          settings: { store_name: 'KEN ENTERPRISE' },
          primaryOutlet: { id: '11111111-1111-1111-1111-111111111111', name: 'HQ-NODE' },
          token: jwt.sign({ 
             id: master ? master.id : '00000000-0000-0000-0000-000000000000', role: 'superadmin', tenantId: '00000000-0000-0000-0000-000000000000', name: 'Master System'
          }, process.env.JWT_SECRET || 'ken_enterprise_secret_2024', { expiresIn: '24h' })
        };
      }
    }

    // 2. STANDARD-PATH: Robust Multi-Tenant Authentication
    const { data: user, error: userError } = await UserRepository.getUserByLogin(loginIdentifier);
    if (userError || !user || !bcrypt.compareSync(password, user.password)) {
      throw new Error('Identitas atau password tidak valid');
    }

    const [settings, primaryOutlet] = await Promise.all([
      UserRepository.getSettings(user.tenant_id),
      UserRepository.getPrimaryOutlet(user.tenant_id)
    ]);

    const token = jwt.sign(
      { 
        id: user.id, 
        role: user.role, 
        tenantId: user.tenant_id, 
        name: user.name,
        scope: user.scope || 'outlet',
        allowed_outlets: user.allowed_outlets || []
      }, 
      process.env.JWT_SECRET || 'ken_enterprise_secret_2024',
      { expiresIn: '24h' }
    );

    return { user, tenant: user.tenant, settings, primaryOutlet, token };
  }

  async getAllUsers(tenantId) {
    // Superadmin bypass: fetch all users
    if (tenantId === '00000000-0000-0000-0000-000000000000') {
      return await UserRepository.getUsersByTenant(null);
    }
    return await UserRepository.getUsersByTenant(tenantId);
  }

  async getEmployees(tenantId) {
    if (!tenantId) throw new Error('Tenant ID required');
    const users = await UserRepository.getUsersByTenant(tenantId);
    
    // Map user permissions.profile to emp.profile
    return (users || []).map(u => {
      const perms = typeof u.permissions === 'string' ? JSON.parse(u.permissions) : (u.permissions || {});
      return {
        id: u.id,
        name: u.name,
        username: u.username,
        email: u.email,
        role: u.role,
        avatar: u.avatar || u.avatar_url,
        profile: perms.profile || {
          base_salary: 0,
          allowances: 0,
          position: u.role
        }
      };
    });
  }

  async updateEmployeeProfile(id, tenantId, profileData) {
    if (!tenantId) throw new Error('Tenant ID required');
    
    const { data: user, error } = await UserRepository.getUserById(id, tenantId);
    if (error || !user) throw new Error('User/Pegawai tidak ditemukan');

    const currentPerms = typeof user.permissions === 'string' ? JSON.parse(user.permissions) : (user.permissions || {});
    const updatedPerms = {
      ...currentPerms,
      profile: {
        base_salary: Number(profileData.base_salary) || 0,
        allowances: Number(profileData.allowances) || 0,
        position: profileData.position || user.role
      }
    };

    const updatedUser = await UserRepository.updateUser(id, tenantId, { permissions: updatedPerms });
    return {
      id: updatedUser.id,
      name: updatedUser.name,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      profile: updatedPerms.profile
    };
  }

  async createUser(userData, tenantId) {
    const hash = userData.password ? await bcrypt.hash(userData.password, 10) : null;
    return await UserRepository.createUser({
      ...userData,
      password: hash,
      tenant_id: tenantId
    });
  }

  async updateUser(id, tenantId, updateData) {
    let finalUpdate = { ...updateData };
    if (updateData.password && updateData.password.trim() !== '') {
       finalUpdate.password = await bcrypt.hash(updateData.password, 10);
    }
    return await UserRepository.updateUser(id, tenantId, finalUpdate);
  }

  async deleteUser(id, tenantId) {
    return await UserRepository.softDeleteUser(id, tenantId);
  }

  // --- Roles ---
  async getRolePermissions(tenantId) {
    return await UserRepository.getRolePermissions(tenantId);
  }

  async saveRolePermissions(role, permissions, tenantId) {
    const keyMap = {
      'akses_kasir': 'pos',
      'akses_gudang': 'inventory',
      'akses_dapur': 'kds',
      'akses_keuangan': 'accounting',
      'lihat_hpp': 'laporan', 
      'lihat_laba': 'dashboard',
      'hapus_transaksi': 'transactions',
      'atur_user': 'system'
    };

    const inserts = [];
    for (const [uiKey, value] of Object.entries(permissions)) {
       if (value) {
          inserts.push({
             role,
             feature_key: keyMap[uiKey] || uiKey,
             can_view: true,
             can_create: true,
             can_edit: true,
             can_delete: uiKey === 'hapus_transaksi' ? true : false,
             tenant_id: tenantId
          });
       }
    }
    return await UserRepository.saveRolePermissions(role, tenantId, inserts);
  }

  // --- Tenants (Superadmin) ---
  async getAllTenants(role) {
    if (role !== 'superadmin') throw new Error('Akses Ditolak');
    return await UserRepository.getAllTenants();
  }

  // Tier quota mapping constant
  getTierQuotas(tier) {
    const quotas = {
      lite: { max_outlets: 1, max_users: 10, storage_limit_mb: 256 },
      pro: { max_outlets: 10, max_users: 30, storage_limit_mb: 1024 },
      enterprise: { max_outlets: 50, max_users: 200, storage_limit_mb: 5120 }
    };
    return quotas[tier?.toLowerCase()] || quotas.lite;
  }

  async updateTenant(id, updateData, role) {
    if (role !== 'superadmin') throw new Error('Akses Ditolak');
    
    let finalUpdate = { ...updateData };
    if (updateData.tier) {
      const quotas = this.getTierQuotas(updateData.tier);
      finalUpdate = {
        ...finalUpdate,
        ...quotas
      };
    }
    
    return await UserRepository.updateTenant(id, finalUpdate);
  }

  async createTenant(name, tier, role) {
    if (role !== 'superadmin') throw new Error('Akses Ditolak');
    if (!name) throw new Error('Nama Bisnis wajib diisi');
    
    const selectedTier = tier || 'lite';
    const quotas = this.getTierQuotas(selectedTier);
    
    return await UserRepository.createTenant({ 
      name, 
      tier: selectedTier, 
      is_active: true,
      ...quotas
    });
  }

  async updateTenantFeatures(tenantId, feature_overrides, role) {
    if (role !== 'owner' && role !== 'superadmin') throw new Error('Hanya Owner yang dapat merubah pengaturan modul');
    if (!tenantId) throw new Error('Tenant ID tidak valid');
    return await UserRepository.updateTenant(tenantId, { feature_overrides });
  }

  // --- Customers & Settings ---
  async getCustomers(tenantId) {
    let { data, error } = await UserRepository.getCustomers(tenantId);
    if (error && error.code === 'PGRST205') return [];
    if (error) {
      // Fallback
      const { data: userData } = await UserRepository.getUserByLogin('pelanggan'); // this is a bad fallback logic but keeping original behavior structure
      return []; // Just return empty if error
    }
    return data || [];
  }

  async getPaymentMethods(tenantId, activeOnly = false) {
    const { data, error } = await UserRepository.getPaymentMethods(tenantId);
    if (error) return ['Cash', 'QRIS', 'Transfer'];
    let list = data || [];
    if (activeOnly) {
      list = list.filter(m => m.is_active !== false);
    }
    return list;
  }

  async addPaymentMethod(payload, tenantId) {
    if (!tenantId) throw new Error('Tenant ID required');
    return await UserRepository.createPaymentMethod({
      ...payload,
      tenant_id: tenantId
    });
  }

  async updatePaymentMethod(id, payload, tenantId) {
    if (!tenantId) throw new Error('Tenant ID required');
    const cleanPayload = { ...payload };
    delete cleanPayload.id;
    delete cleanPayload.tenant_id;
    return await UserRepository.updatePaymentMethod(id, cleanPayload, tenantId);
  }

  async deletePaymentMethod(id, tenantId) {
    if (!tenantId) throw new Error('Tenant ID required');
    return await UserRepository.deletePaymentMethod(id, tenantId);
  }

  async logSystemActivity(payload, context) {
    const { supabase } = require('../supabase');
    let displayName = payload.userName || payload.user_name || context.name || 'System User';
    const outletId = payload.outletId || payload.outlet_id || context.outletId;

    if (outletId) {
      try {
        const { data: outlet } = await supabase.from('outlets').select('name').eq('id', outletId).maybeSingle();
        if (outlet && outlet.name) {
          displayName = `${displayName} (Outlet: ${outlet.name})`;
        }
      } catch (err) {}
    }

    const logPayload = {
      tenant_id: context.tenantId || payload.tenantId || payload.tenant_id || '00000000-0000-0000-0000-000000000000',
      user_name: displayName,
      role: payload.role || context.role || 'guest',
      activity_type: payload.activityType || payload.activity_type || 'SYSTEM',
      description: payload.description || 'No description provided',
      created_at: new Date().toISOString()
    };
    return await UserRepository.logActivity(logPayload);
  }
}

module.exports = new UserService();
