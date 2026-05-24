const { supabase } = require('../supabase');

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

            // 1. MASTER BYPASS: Superadmin has absolute power
            if (role === 'superadmin') return next();

            // 1.5 CHECK USER-SPECIFIC PERMISSIONS (Overrides role)
            if (activeId) {
                const { data: userPerm } = await supabase.from('users').select('permissions').eq('id', activeId).maybeSingle();
                if (userPerm && userPerm.permissions) {
                   if (userPerm.permissions.all) return next();
                   if (userPerm.permissions[featureKey] === true) return next();
                }
            }

            // 2. QUERY DYNAMIC PERMISSIONS
            const { data: perm, error } = await supabase
                .from('role_permissions')
                .select('*')
                .eq('tenant_id', tenantId)
                .eq('role', role)
                .eq('feature_key', featureKey)
                .maybeSingle();

            if (error) throw error;

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
            const defaultRoles = {
                'owner': true, 
                'manager': true, 
                'accounting': ['accounting', 'keuangan', 'reports', 'dashboard', 'inventory', 'procurement'].includes(featureKey),
                'chef': ['inventory', 'menu', 'kds', 'dashboard', 'procurement'].includes(featureKey),
                'staff': ['pos', 'dashboard', 'shifts', 'tables', 'inventory'].includes(featureKey),
                'hrd': ['hrd', 'dashboard'].includes(featureKey)
            };

            if (defaultRoles[role] === true || (Array.isArray(defaultRoles[role]) && defaultRoles[role].includes(featureKey))) {
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
