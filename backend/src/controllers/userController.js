const UserService = require('../services/userService');

class UserController {
  async login(req, res) {
    try {
      const { email, username, password } = req.body;
      const loginIdentifier = username || email;

      // ----- Superadmin shortcut (development & fallback) -----
      if (loginIdentifier === 'superadmin' && password === 'admin123') {
        const jwt = require('jsonwebtoken');
        const token = jwt.sign({
          id: '00000000-0000-0000-0000-000000000000',
          role: 'superadmin',
          tenantId: '00000000-0000-0000-0000-000000000000',
          name: 'Master System'
        }, process.env.JWT_SECRET || 'ken_enterprise_secret_2024', { expiresIn: '24h' });
        return res.json({
          user: { id: '00000000-0000-0000-0000-000000000000', username: 'superadmin', role: 'superadmin' },
          tenant: { id: '00000000-0000-0000-0000-000000000000', name: 'KEN GLOBAL HQ' },
          settings: { store_name: 'KEN ENTERPRISE' },
          primaryOutlet: { id: '11111111-1111-1111-1111-111111111111', name: 'HQ-NODE' },
          token,
        });
      }
      
      const result = await UserService.login(loginIdentifier, password);
      res.json(result);
    } catch (err) {
      console.error('❌ [Login Error]:', err.message);
      res.status(err.message.includes('Identitas atau password') ? 401 : 500)
         .json({ error: err.message });
    }
  }

  async getUsers(req, res) {
    try {
      const { tenantId } = req.userContext;
      const users = await UserService.getAllUsers(tenantId);
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getEmployees(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const employees = await UserService.getEmployees(tenantId);
      res.json(employees);
    } catch (err) {
      console.error('❌ [HRD Employees Fetch Error]:', err);
      res.status(err.message.includes('Tenant ID required') ? 403 : 500).json({ error: err.message });
    }
  }

  async updateEmployeeProfile(req, res) {
    try {
      const { tenantId } = req.userContext || {};
      const { id } = req.params;
      const profile = await UserService.updateEmployeeProfile(id, tenantId, req.body);
      res.json(profile);
    } catch (err) {
      console.error('❌ [HRD Employee Profile Save Error]:', err);
      res.status(err.message.includes('User/Pegawai tidak ditemukan') ? 404 : 500).json({ error: err.message });
    }
  }

  async createUser(req, res) {
    try {
      const { tenantId } = req.userContext;
      const user = await UserService.createUser(req.body, tenantId);
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async updateUser(req, res) {
    try {
      const { tenantId } = req.userContext;
      const { id } = req.params;
      const user = await UserService.updateUser(id, tenantId, req.body);
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async deleteUser(req, res) {
    try {
      const { tenantId } = req.userContext;
      const { id } = req.params;
      await UserService.deleteUser(id, tenantId);
      res.json({ success: true, message: 'Berhasil di soft-delete' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // --- Roles ---
  async getRolePermissions(req, res) {
    try {
      const { tenantId } = req.userContext;
      const data = await UserService.getRolePermissions(tenantId);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async saveRolePermissions(req, res) {
    try {
      const { tenantId } = req.userContext;
      const { role, permissions } = req.body;
      await UserService.saveRolePermissions(role, permissions, tenantId);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // --- Tenants ---
  async getTenants(req, res) {
    try {
      const { role } = req.userContext || {};
      const data = await UserService.getAllTenants(role);
      res.json(data);
    } catch (err) {
      res.status(err.message.includes('Akses Ditolak') ? 403 : 500).json({ error: err.message });
    }
  }

  async updateTenant(req, res) {
    try {
      const { role } = req.userContext || {};
      const { id } = req.params;
      const data = await UserService.updateTenant(id, req.body, role);
      res.json(data);
    } catch (err) {
      res.status(err.message.includes('Akses Ditolak') ? 403 : 500).json({ error: err.message });
    }
  }

  async createTenant(req, res) {
    try {
      const { role } = req.userContext || {};
      const { name, tier } = req.body;
      const data = await UserService.createTenant(name, tier, role);
      res.json(data);
    } catch (err) {
      res.status(err.message.includes('Akses Ditolak') ? 403 : 500).json({ error: err.message });
    }
  }

  async updateTenantFeatures(req, res) {
    try {
      const { role, tenantId } = req.userContext || {};
      const { feature_overrides } = req.body;
      const data = await UserService.updateTenantFeatures(tenantId, feature_overrides, role);
      res.json(data);
    } catch (err) {
      res.status(403).json({ error: err.message });
    }
  }

  // --- Customers & Misc ---
  async getCustomers(req, res) {
    try {
      const { tenantId } = req.userContext;
      const data = await UserService.getCustomers(tenantId);
      res.json(data);
    } catch (err) {
      res.json([]);
    }
  }

  async getPaymentMethods(req, res) {
    try {
      const { tenantId } = req.userContext;
      const data = await UserService.getPaymentMethods(tenantId);
      res.json(data);
    } catch (err) {
      res.json(['Cash', 'QRIS', 'Transfer']);
    }
  }

  async logSystemActivity(req, res) {
    try {
      const context = req.userContext || {};
      const data = await UserService.logSystemActivity(req.body, context);
      res.json(data);
    } catch (err) {
      console.error('⚠️ [System Logs POST Error]:', err.message);
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new UserController();
