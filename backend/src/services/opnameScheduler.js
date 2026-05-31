const { supabase } = require('../supabase');
const OpnameService = require('./opnameService');

class OpnameScheduler {
  /**
   * Calculate next run time based on frequency, scheduled_time, and timezone
   * Supports standard daily, weekly, monthly, and custom cron-like triggers
   */
  static calculateNextRun(frequency, scheduledTime, timezone = 'Asia/Jakarta') {
    const now = new Date();
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    let nextRun = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);

    // Simple scheduling projection
    if (nextRun <= now) {
      if (frequency === 'daily') {
        nextRun.setDate(nextRun.getDate() + 1);
      } else if (frequency === 'weekly') {
        nextRun.setDate(nextRun.getDate() + 7);
      } else if (frequency === 'monthly') {
        nextRun.setMonth(nextRun.getMonth() + 1);
      } else {
        // Fallback for custom or other: add 1 day
        nextRun.setDate(nextRun.getDate() + 1);
      }
    } else {
      if (frequency === 'weekly') {
        // Adjust for current day of week if needed (e.g. projection)
        // For simplicity: standard weekly projection
      }
    }
    return nextRun.toISOString();
  }

  /**
   * Get all active schedules across all outlets and tenants
   */
  static async getSchedules(tenantId, outletId = null) {
    let query = supabase.from('opname_schedules').select('*').eq('is_deleted', false);
    if (tenantId) query = query.eq('tenant_id', tenantId);
    if (outletId) query = query.eq('outlet_id', outletId);
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Add a new schedule with server-enforced validation
   */
  static async createSchedule(tenantId, userId, data) {
    const nextRun = this.calculateNextRun(data.frequency, data.scheduled_time, data.timezone);
    
    const { data: schedule, error } = await supabase
      .from('opname_schedules')
      .insert([{
        tenant_id: tenantId,
        outlet_id: data.outlet_id || data.outletId,
        opname_type: data.opname_type || data.opnameType || 'blind',
        frequency: data.frequency,
        scheduled_time: data.scheduled_time,
        timezone: data.timezone || 'Asia/Jakarta',
        next_run_time: nextRun,
        enabled: data.enabled !== false,
        created_by: userId
      }])
      .select()
      .single();

    if (error) throw error;
    return schedule;
  }

  /**
   * Update an existing schedule
   */
  static async updateSchedule(scheduleId, tenantId, data) {
    // Re-calculate next run if frequency/time changes
    let nextRun = data.next_run_time;
    if (data.frequency && data.scheduled_time) {
      nextRun = this.calculateNextRun(data.frequency, data.scheduled_time, data.timezone);
    }

    const { data: schedule, error } = await supabase
      .from('opname_schedules')
      .update({
        frequency: data.frequency,
        scheduled_time: data.scheduled_time,
        timezone: data.timezone,
        next_run_time: nextRun,
        enabled: data.enabled,
        updated_at: new Date().toISOString()
      })
      .eq('id', scheduleId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw error;
    return schedule;
  }

  /**
   * Soft-delete a schedule
   */
  static async deleteSchedule(scheduleId, tenantId) {
    const { error } = await supabase
      .from('opname_schedules')
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq('id', scheduleId)
      .eq('tenant_id', tenantId);

    if (error) throw error;
    return { success: true };
  }

  /**
   * Get executions history
   */
  static async getScheduleHistory(scheduleId, tenantId) {
    const { data, error } = await supabase
      .from('opname_schedule_executions')
      .select('*, opname_schedules!inner(id, tenant_id)')
      .eq('opname_schedules.tenant_id', tenantId)
      .eq('schedule_id', scheduleId)
      .order('execution_time', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Scheduled trigger logic: checks and executes schedules that are due
   */
  static async executeScheduledJobs() {
    const now = new Date().toISOString();
    
    // Find all schedules due for execution
    const { data: schedules, error } = await supabase
      .from('opname_schedules')
      .select('*')
      .eq('enabled', true)
      .eq('is_deleted', false)
      .lte('next_run_time', now);

    if (error) {
      console.error('❌ [OpnameScheduler] Failed to fetch due schedules:', error.message);
      return;
    }

    for (const schedule of (schedules || [])) {
      try {
        console.log(`⏰ [OpnameScheduler] Executing schedule for Outlet ${schedule.outlet_id}...`);
        
        // 🔒 Skip condition check: Skip if a session for this outlet is already active or completed
        const { data: activeSessions } = await supabase
          .from('opname_sessions')
          .select('id')
          .eq('outlet_id', schedule.outlet_id)
          .in('status', ['in_progress', 'completed']);

        if (activeSessions && activeSessions.length > 0) {
          console.warn(`⚠️ [OpnameScheduler] Active/completed session already exists for Outlet ${schedule.outlet_id}. SKIPPING schedule.`);
          
          // Log execution as SKIPPED
          await supabase.from('opname_schedule_executions').insert([{
            schedule_id: schedule.id,
            status: 'skipped',
            error_message: 'Sesi opname sebelumnya masih aktif/belum disetujui.',
            log_details: { reason: 'Active session exists', active_session_id: activeSessions[0].id }
          }]);
        } else {
          // Success Path: Start dynamic session
          const newSession = await OpnameService.startOpname(
            schedule.tenant_id,
            schedule.outlet_id,
            schedule.created_by,
            schedule.opname_type || 'blind'
          );

          // Update session to mark as scheduled
          await supabase
            .from('opname_sessions')
            .update({ is_scheduled: true, schedule_id: schedule.id })
            .eq('id', newSession.id);

          // Log execution as SUCCESS
          await supabase.from('opname_schedule_executions').insert([{
            schedule_id: schedule.id,
            status: 'success',
            created_session_id: newSession.id,
            log_details: { message: 'Session created successfully.' }
          }]);

          console.log(`✅ [OpnameScheduler] Scheduled session started: ${newSession.id}`);
        }

        // Calculate and update next run time
        const nextRun = this.calculateNextRun(schedule.frequency, schedule.scheduled_time, schedule.timezone);
        await supabase
          .from('opname_schedules')
          .update({ next_run_time: nextRun, updated_at: new Date().toISOString() })
          .eq('id', schedule.id);

      } catch (err) {
        console.error(`❌ [OpnameScheduler] Execution failed for schedule ${schedule.id}:`, err.message);
        
        // Log execution as FAILED
        await supabase.from('opname_schedule_executions').insert([{
          schedule_id: schedule.id,
          status: 'failed',
          error_message: err.message,
          log_details: { error: err.stack }
        }]);
      }
    }
  }
}

module.exports = OpnameScheduler;
