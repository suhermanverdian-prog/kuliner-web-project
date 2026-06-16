const { supabase } = require('../supabase');
const cache = require('../utils/cache');

/**
 * @middleware permissionGuard
 * @description Dinamic Permission Control for KEN Enterprise
 * @param {string} featureKey - Nama fitur (e.g., 'inventory', 'procurement')
 * @param {string} action - 'view', 'create', 'edit', 'delete'
 */
const permissionGuard = (featureKey, action = 'view') => {
    return async (req, res, next) => {
        try {
            // 0. RECOVERY BYPASS: If no auth context and in development, provide a fallback
            if (!req.userContext || !req.userContext.role) {
                if (process.env.NODE_ENV !== 'production') {
                    console.warn('⚠️ [Security] Missing context in DEV. Bypassing...');
                    req.userContext = { role: 'superadmin', tenantId: '00000000-0000-0000-0000-000000000000' };
                } else {
                    return res.status(401).json({ error: 'Authentication required' });
                }
            }

            const { id, userId, role, tenantId } = req.userContext;
            const activeId = id || userId;

            // 🔍 DEBUG TRACE (sementara, untuk diagnosa 403)
            console.log(`🔐 [PermGuard] feature=${featureKey} action=${action} role="${role}" tenantId=${tenantId} userId=${activeId}`);

            // 1. MASTER BYPASS: Superadmin has absolute power
            if (role === 'superadmin') return next();

            // 1.2 SCOPE ENFORCEMENT: Outlet / Regional level validation on request parameters
            if (role !== 'owner') {
                const reqOutletId = req.headers['x-outlet-id'] || req.query.outletId || req.query.outlet_id || req.body.outletId || req.body.outlet_id || req.params.outletId || req.params.outlet_id;
                const userScope = req.userContext.scope;
                const allowedOutlets = req.userContext.allowed_outlets;

                if (reqOutletId && userScope && ['outlet', 'regional'].includes(userScope)) {
                    const isAllowed = Array.isArray(allowedOutlets) && allowedOutlets.includes(reqOutletId);
                    if (!isAllowed) {
                        return res.status(403).json({
                            error: 'Akses Ditolak',
                            message: `Konteks operasional Anda dibatasi. Anda tidak memiliki wewenang untuk outlet: ${reqOutletId}`
                        });
                    }
                }
            }

            // 1.5 CHECK USER-SPECIFIC PERMISSIONS (Overrides role - Cached for 5 min)
            if (activeId) {
                const cacheKey = `user_perms_${activeId}`;
                let userPerm = cache.get(cacheKey);
                
                if (!userPerm) {
                    const { data } = await supabase.from('users').select('permissions').eq('id', activeId).maybeSingle();
                    userPerm = data || { permissions: null };
                    cache.set(cacheKey, userPerm, 300); // 5 min TTL
                }
                
                if (userPerm && userPerm.permissions) {
                    if (userPerm.permissions.all) {
                       if (!tenantId) {
                         return res.status(403).json({ error: 'Akses Ditolak: Konteks Tenant tidak ditemukan.' });
                       }
                       return next();
                    }
                    if (userPerm.permissions[featureKey] === true) return next();
                }
            }

            // 2. QUERY DYNAMIC PERMISSIONS (Cached for 5 min)
            const roleCacheKey = `role_perm_${tenantId}_${role}_${featureKey}`;
            let perm = cache.get(roleCacheKey);
            
            if (perm === undefined) {
                const { data, error } = await supabase
                    .from('role_permissions')
                    .select('*')
                    .eq('tenant_id', tenantId)
                    .eq('role', role)
                    .eq('feature_key', featureKey)
                    .maybeSingle();

                if (error) {
                    // ⚠️ Jangan blokir akses saat DB error - gunakan fallback defaultRoles
                    console.warn(`⚠️ [Security] Supabase role_permissions error (falling back to defaults): ${error.message}`);
                    perm = null; // Akan dilanjutkan ke defaultRoles di bawah
                } else {
                    perm = data || null;
                }
                cache.set(roleCacheKey, perm, 300); // 5 min TTL
            }

            // 3. VALIDATE ACTION
            const actionMap = {
                'view': 'can_view',
                'create': 'can_create',
                'edit': 'can_edit',
                'delete': 'can_delete'
            };

            const permissionColumn = actionMap[action];
            
            if (perm && perm[permissionColumn]) {
                return next();
            }

            // 4. FALLBACK: Default hardcoded permissions for legacy support
            // (If no dynamic permission is found in DB, we use these safe defaults)
            const normRole = String(role || '').toLowerCase();
            const defaultRoles = {
                'owner': true, 
                'manager': true, 
                'accounting': ['accounting', 'keuangan', 'reports', 'dashboard', 'inventory', 'procurement'].includes(featureKey),
                'chef': ['inventory', 'menu', 'kds', 'dashboard', 'procurement'].includes(featureKey),
                'staff': ['pos', 'dashboard', 'shifts', 'tables', 'inventory'].includes(featureKey),
                'cashier': ['pos', 'dashboard', 'shifts', 'tables', 'inventory'].includes(featureKey),
                'kasir': ['pos', 'dashboard', 'shifts', 'tables', 'inventory'].includes(featureKey),
                'hrd': ['hrd', 'dashboard'].includes(featureKey),
                'guest': action === 'view'
            };

            if (defaultRoles[normRole] === true || (Array.isArray(defaultRoles[normRole]) && defaultRoles[normRole].includes(featureKey))) {
                return next();
            }

            return res.status(403).json({ 
                error: 'Akses Ditolak', 
                message: `Role ${role} tidak memiliki izin ${action} untuk fitur ${featureKey}` 
            });

        } catch (err) {
            console.error('🚨 [Security] Permission Guard Error:', err.message);
            res.status(500).json({ error: 'Security Validation Failed' });
        }
    };
};

module.exports = permissionGuard;
