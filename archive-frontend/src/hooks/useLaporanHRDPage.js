import { useState, useEffect } from 'react';
import { api } from '../api';

export function useLaporanHRDPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [salaryForm, setSalaryForm] = useState({ base_salary: 0, allowances: 0, position: '' });
  const [payrollPeriod, setPayrollPeriod] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
  
  // Interactive 10x Modals State
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payingPayroll, setPayingPayroll] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const data = await api.getEmployees();
      setEmployees(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSelectEmployee = (emp) => {
    setSelectedEmp(emp);
    setSalaryForm({
      base_salary: emp.profile?.base_salary || 0,
      allowances: emp.profile?.allowances || 0,
      position: emp.profile?.position || emp.role
    });
  };

  const handleSaveProfile = async () => {
    try {
      await api.saveEmployeeProfile(selectedEmp.id, salaryForm);
      alert('Profil gaji berhasil diperbarui!');
      fetchEmployees();
    } catch (err) { alert('Gagal simpan data'); }
  };

  const handlePaySalary = async () => {
    setPayingPayroll(true);
    try {
      const res = await api.paySalary(selectedEmp.id, {
        base_salary: selectedEmp.profile?.base_salary || 0,
        allowances: selectedEmp.profile?.allowances || 0,
        month: payrollPeriod.month,
        year: payrollPeriod.year
      });
      if (res.success) {
        setPaymentSuccess(true);
        setTimeout(() => {
          setPaymentSuccess(false);
          setShowPayModal(false);
          fetchEmployees();
        }, 2200);
      } else {
        alert(res.error || 'Gagal memproses gaji');
      }
    } catch (err) {
      alert(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setPayingPayroll(false);
    }
  };

  return {
    employees, setEmployees,
    loading, setLoading,
    selectedEmp, setSelectedEmp,
    salaryForm, setSalaryForm,
    payrollPeriod, setPayrollPeriod,
    showAttendanceModal, setShowAttendanceModal,
    showPayModal, setShowPayModal,
    payingPayroll, setPayingPayroll,
    paymentSuccess, setPaymentSuccess,
    handleSelectEmployee,
    handleSaveProfile,
    handlePaySalary
  };
}
