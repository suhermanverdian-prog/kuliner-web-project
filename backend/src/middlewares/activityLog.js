const { supabase } = require('../supabase');

/**
 * Activity Log Middleware
 * Captures mutating requests (POST, PUT, PATCH, DELETE) and stores before/after state.
 * Stores in 'activity_logs' with: tenant_id, user_name, role, activity_type, description, old_value, new_value.
 */
const activityLog = async (req, res, next) => {
  const mutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  if (!mutating) return next();

  // Stealth bypass for system logs POST to avoid infinite loop
  if (req.path === '/system-logs') return next();

  const start = Date.now();
  const { userId, role, tenantId, name } = req.userContext || {};
  const resource = req.path;
  const resourceId = req.params.id || null;
  const before = null; // placeholder

  // Listen for response finish to capture after state if created/updated
  const originalJson = res.json.bind(res);
  res.json = async (payload) => {
    try {
      const after = payload;
      await supabase.from('activity_logs').insert([
        {
          tenant_id: tenantId || '00000000-0000-0000-0000-000000000000',
          user_name: name || 'System User',
          role: role || 'guest',
          activity_type: req.method,
          description: `${req.method} request to ${resource}${resourceId ? ' (ID: ' + resourceId + ')' : ''}`,
          old_value: before,
          new_value: after,
          created_at: new Date().toISOString()
        },
      ]);
    } catch (e) {
      console.error('🚨 [ActivityLog] Insert failed:', e.message);
    }
    return originalJson(payload);
  };
  next();
};

module.exports = activityLog;
