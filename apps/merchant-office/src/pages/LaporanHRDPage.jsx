import { 
  Users, DollarSign, Clock, Calendar, 
  ArrowRight, ShieldCheck, UserPlus, 
  Download, FileText, CheckCircle2, TrendingUp, X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { cn } from '../lib/utils';
import { useLaporanHRDPage } from '../hooks/useLaporanHRDPage';


export default function LaporanHRDPage({ user }) {
  const {
    employees,
    selectedEmp,
    salaryForm, setSalaryForm,
    payrollPeriod,
    showAttendanceModal, setShowAttendanceModal,
    showPayModal, setShowPayModal,
    payingPayroll,
    paymentSuccess,
    handleSelectEmployee,
    handleSaveProfile,
    handlePaySalary
  } = useLaporanHRDPage();
  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 font-mono tabular-nums">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Divisi HRD & Payroll</h1>
           <p className="text-zinc-500 dark:text-zinc-100 mt-1 font-medium italic">Manajemen SDM, Struktur Gaji, dan Akuntabilitas Penggajian.</p>
        </div>
        <div className="flex gap-4">
           <Button variant="outline" className="rounded-lg font-bold border-amber-500 dark:border-amber-400 text-amber-600 dark:text-amber-400">
              <Download size={16} className="mr-2" /> Slip Gaji Massal
           </Button>
           <Button className="bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 transition-all active:scale-95">
              <UserPlus size={16} className="mr-2" /> Rekrut Pegawai
           </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Employee List */}
         <Card className="lg:col-span-1 border-none shadow-xl bg-card overflow-hidden">
            <CardHeader className="bg-background border-b">
               <CardTitle className="text-lg text-zinc-900 dark:text-zinc-100">Daftar Pegawai</CardTitle>
               <CardDescription>Pilih pegawai untuk kelola payroll.</CardDescription>
            </CardHeader>
            <CardContent className="p-2 h-[600px] overflow-y-auto no-scrollbar">
               <div className="space-y-1">
                  {employees.map(emp => (
                     <button 
                       key={emp.id} 
                       onClick={() => handleSelectEmployee(emp)}
                       className={cn(
                         "w-full flex items-center gap-4 p-4 rounded-lg transition-all text-left",
                         selectedEmp?.id === emp.id 
                           ? "bg-amber-500 text-white dark:text-zinc-100 shadow-lg shadow-amber-500/20" 
                           : "hover:bg-background text-zinc-800 dark:text-zinc-100"
                       )}
                     >
                        <div className="w-10 h-10 rounded-lg ">
                           {emp.name[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="font-bold text-sm truncate">{emp.name}</p>
                           <p className={cn("text-[10px] font-black uppercase tracking-widest", selectedEmp?.id === emp.id ? "text-zinc-900 dark:text-zinc-100/70" : "text-zinc-500 dark:text-zinc-100")}>
                              {emp.profile?.position || emp.role}
                           </p>
                        </div>
                        {emp.profile?.base_salary > 0 && <ShieldCheck size={14} className={selectedEmp?.id === emp.id ? "text-zinc-900 dark:text-zinc-100" : "text-amber-500"} />}
                     </button>
                  ))}
               </div>
            </CardContent>
         </Card>

         {/* Payroll & Profile Editor */}
         <div className="lg:col-span-2 space-y-8">
            {selectedEmp ? (
               <>
                  <Card className="border-none shadow-xl bg-card overflow-hidden">
                     <CardHeader className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-500/10">
                        <div className="flex items-center gap-6">
                           <div className="w-16 h-16 rounded-lg ">
                              {selectedEmp.name[0].toUpperCase()}
                           </div>
                           <div>
                              <CardTitle className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{selectedEmp.name}</CardTitle>
                              <CardDescription className="font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">Struktur Penggajian</CardDescription>
                           </div>
                        </div>
                     </CardHeader>
                     <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100 px-1">Gaji Pokok (Monthly)</label>
                              <div className="relative">
                                 <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-zinc-500 dark:text-zinc-100">Rp</span>
                                 <Input 
                                   type="number" 
                                   className="h-12 pl-12 rounded-lg bg-background border-none font-black font-mono tabular-nums text-zinc-900 dark:text-zinc-100"
                                   value={salaryForm.base_salary}
                                   onChange={e => setSalaryForm({...salaryForm, base_salary: Number(e.target.value)})}
                                 />
                              </div>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100 px-1">Tunjangan Tetap</label>
                              <div className="relative">
                                 <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-zinc-500 dark:text-zinc-100">Rp</span>
                                 <Input 
                                   type="number" 
                                   className="h-12 pl-12 rounded-lg bg-background border-none font-black font-mono tabular-nums text-zinc-900 dark:text-zinc-100"
                                   value={salaryForm.allowances}
                                   onChange={e => setSalaryForm({...salaryForm, allowances: Number(e.target.value)})}
                                 />
                              </div>
                           </div>
                        </div>
                        <div className="space-y-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100 px-1">Jabatan Resmi</label>
                              <Input 
                                className="h-12 rounded-lg bg-background border-none font-bold text-zinc-900 dark:text-zinc-100" 
                                placeholder="Contoh: Head Barista"
                                value={salaryForm.position}
                                onChange={e => setSalaryForm({...salaryForm, position: e.target.value})}
                              />
                           </div>
                           <div className="p-6 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-500/10 flex items-center justify-between">
                              <div>
                                 <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">Total Take Home Pay</p>
                                 <p className="text-2xl font-black font-mono tabular-nums text-zinc-900 dark:text-zinc-100">Rp {(salaryForm.base_salary + salaryForm.allowances).toLocaleString()}</p>
                              </div>
                              <TrendingUp className="text-amber-600 dark:text-amber-400 " size={40} />
                           </div>
                        </div>
                     </CardContent>
                     <CardFooter className="bg-background p-6 border-t">
                        <Button className="w-full h-12 bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 transition-all active:scale-95" onClick={handleSaveProfile}>
                           Simpan Profil Gaji
                        </Button>
                     </CardFooter>
                  </Card>

                  {/* Monthly Payroll Generator */}
                  <Card className="border-none shadow-xl bg-card">
                     <CardHeader className="border-b">
                        <CardTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                           <DollarSign size={20} className="text-amber-600 dark:text-amber-400" /> Generate Payroll Bulanan
                        </CardTitle>
                     </CardHeader>
                     <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8">
                        <div className="flex-1 space-y-2 text-center md:text-left">
                           <p className="text-sm font-bold text-zinc-500 dark:text-zinc-100">Proses gaji untuk periode:</p>
                           <p className="text-2xl font-black text-amber-600 dark:text-amber-400 uppercase tracking-tighter">
                              {new Date(0, payrollPeriod.month - 1).toLocaleString('id-ID', { month: 'long' })} {payrollPeriod.year}
                           </p>
                        </div>
                        <div className="flex items-center gap-4">
                           <Button variant="outline" className="h-14 px-8 rounded-lg font-black gap-2 border-2 text-zinc-800 dark:text-zinc-100" onClick={() => setShowAttendanceModal(true)}>
                              <FileText size={18} /> Review Absensi
                           </Button>
                           <Button 
                             className="h-14 px-10 bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 transition-all active:scale-95"
                             onClick={() => setShowPayModal(true)}
                           >
                              BAYAR GAJI <ArrowRight size={20} className="ml-2 group-hover:translate-x-2 transition-transform" />
                           </Button>
                        </div>
                     </CardContent>
                  </Card>
               </>
            ) : (
               <div className="h-full flex flex-col items-center justify-center p-20 text-center space-y-6  grayscale">
                  <Users size={120} strokeWidth={1} />
                  <div>
                     <h3 className="text-3xl font-black">Manajemen SDM</h3>
                     <p className="text-lg">Pilih pegawai di sebelah kiri untuk mengelola data penggajian.</p>
                  </div>
               </div>
            )}
         </div>
      </div>

      {/* 10X VALUE MODAL 1: ATTENDANCE REVIEW */}
      {showAttendanceModal && selectedEmp && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
          <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 border-none rounded-lg overflow-hidden bg-card text-card-foreground">
            <CardHeader className="border-b bg-background flex flex-row items-center justify-between p-6">
              <div>
                <CardTitle className="text-xl flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                  <Clock className="text-amber-600 dark:text-amber-400" /> Review Absensi Pegawai
                </CardTitle>
                <CardDescription className="font-bold text-amber-600 dark:text-amber-400">{selectedEmp.name}</CardDescription>
              </div>
              <Button variant="ghost" size="icon" className="rounded-lg h-8 w-8 p-0" onClick={() => setShowAttendanceModal(false)}>
                <X size={18} />
              </Button>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-background">
                  <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-100 uppercase tracking-widest">Kehadiran</p>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono tabular-nums">22 Hari</p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-100 mt-1">91.6% Kehadiran</p>
                </div>
                <div className="p-4 bg-background">
                  <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-100 uppercase tracking-widest">Keterlambatan</p>
                  <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 font-mono tabular-nums">1 Kali</p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-100 mt-1">15 Menit Total</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-background">
                  <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-100 uppercase tracking-widest">Sakit / Izin</p>
                  <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 font-mono tabular-nums">2 Hari</p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-100 mt-1">Izin Resmi</p>
                </div>
                <div className="p-4 bg-background">
                  <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-100 uppercase tracking-widest">Lembur</p>
                  <p className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1 font-mono tabular-nums">4 Jam</p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-100 mt-1">Rata-rata 1 Jam/Minggu</p>
                </div>
              </div>
              <div className="p-6 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Evaluasi Performa</p>
                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-1 leading-relaxed">
                  Rekomendasi Payroll: <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">Sangat Baik</span>. Kehadiran konsisten, lembur terjadwal dengan rapi, dan performa di outlet memuaskan. Gaji layak dibayarkan penuh.
                </p>
              </div>
            </CardContent>
            <CardFooter className="p-6 border-t bg-background">
              <Button className="w-full font-black bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 transition-all active:scale-95" onClick={() => setShowAttendanceModal(false)}>
                TUTUP REVIEW
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* 10X VALUE MODAL 2: PAYROLL CONFIRMATION */}
      {showPayModal && selectedEmp && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
          <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 border-none rounded-lg overflow-hidden bg-card text-card-foreground">
            <CardHeader className="border-b bg-background flex flex-row items-center justify-between p-6">
              <div>
                <CardTitle className="text-xl flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                  <DollarSign className="text-amber-600 dark:text-amber-400" /> Konfirmasi Bayar Gaji
                </CardTitle>
                <CardDescription>Review rincian transfer dana payroll.</CardDescription>
              </div>
              <Button variant="ghost" size="icon" className="rounded-lg h-8 w-8 p-0" onClick={() => !payingPayroll && setShowPayModal(false)}>
                <X size={18} />
              </Button>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {paymentSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center animate-in zoom-in-95">
                  <div className="w-20 h-20 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 size={48} className="animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">Pembayaran Berhasil!</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-100 mt-1">Jurnal double-entry otomatis telah dicatat di Buku Besar.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 p-4 bg-background">
                    <div className="w-12 h-12 rounded-lg ">
                      {selectedEmp.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-sm text-zinc-900 dark:text-zinc-100">{selectedEmp.name}</p>
                      <p className="text-[10px] font-black text-zinc-500 dark:text-zinc-100 uppercase tracking-widest">
                        {selectedEmp.profile?.position || selectedEmp.role}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4 border-y border-dashed py-4 font-mono text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-500 dark:text-zinc-100">Periode Gaji</span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        {new Date(0, payrollPeriod.month - 1).toLocaleString('id-ID', { month: 'long' })} {payrollPeriod.year}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 dark:text-zinc-100">Gaji Pokok</span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">Rp {(selectedEmp.profile?.base_salary || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 dark:text-zinc-100">Tunjangan</span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">Rp {(selectedEmp.profile?.allowances || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t border-dashed pt-4 text-base font-bold">
                      <span className="text-zinc-900 dark:text-zinc-100">Total Transfer</span>
                      <span className="text-amber-500 tabular-nums">
                        Rp {((selectedEmp.profile?.base_salary || 0) + (selectedEmp.profile?.allowances || 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-500/20 rounded-lg text-[11px] text-amber-700 dark:text-amber-400 font-bold leading-relaxed">
                    ⚠️ Transaksi ini akan memotong rekening kas outlet sebesar total transfer dan langsung mencatatkan mutasi debit-kredit di Buku Besar (Double-Entry).
                  </div>
                </>
              )}
            </CardContent>
            {!paymentSuccess && (
              <CardFooter className="p-6 border-t bg-background flex gap-4">
                <Button variant="ghost" className="flex-1 font-bold rounded-lg" onClick={() => setShowPayModal(false)} disabled={payingPayroll}>
                  Batal
                </Button>
                <Button 
                  className="flex-[2] font-black bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500 transition-all active:scale-95"
                  onClick={handlePaySalary}
                  disabled={payingPayroll}
                >
                  {payingPayroll ? 'Memproses...' : 'KONFIRMASI BAYAR'}
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

