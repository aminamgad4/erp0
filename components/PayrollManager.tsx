'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, DollarSign, Calculator, FileText, Edit, Trash2, Download } from 'lucide-react';
import { Payroll, PayrollFormData, Employee } from '@/lib/models/HR';

interface PayrollManagerProps {
  userRole: string;
  companyId?: string;
}

export default function PayrollManager({ userRole, companyId }: PayrollManagerProps) {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState('all');

  const [formData, setFormData] = useState<PayrollFormData>({
    employeeId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    bonus: 0,
    deductions: 0,
  });

  const months = [
    { value: 1, label: 'يناير' },
    { value: 2, label: 'فبراير' },
    { value: 3, label: 'مارس' },
    { value: 4, label: 'أبريل' },
    { value: 5, label: 'مايو' },
    { value: 6, label: 'يونيو' },
    { value: 7, label: 'يوليو' },
    { value: 8, label: 'أغسطس' },
    { value: 9, label: 'سبتمبر' },
    { value: 10, label: 'أكتوبر' },
    { value: 11, label: 'نوفمبر' },
    { value: 12, label: 'ديسمبر' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  useEffect(() => {
    fetchEmployees();
    fetchPayrolls();
  }, [selectedMonth, selectedYear, statusFilter]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/hr/employees?status=active');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchPayrolls = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedMonth) params.append('month', selectedMonth.toString());
      if (selectedYear) params.append('year', selectedYear.toString());
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/hr/payroll?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setPayrolls(data);
      }
    } catch (error) {
      console.error('Error fetching payrolls:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/hr/payroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        await fetchPayrolls();
        setIsDialogOpen(false);
        resetForm();
      } else {
        alert(result.message || 'حدث خطأ أثناء إنشاء الراتب');
      }
    } catch (error) {
      console.error('Error creating payroll:', error);
      alert('حدث خطأ أثناء إنشاء الراتب');
    }
  };

  const handleStatusUpdate = async (payrollId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/hr/payroll/${payrollId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchPayrolls();
      } else {
        alert(result.message || 'حدث خطأ أثناء تحديث الحالة');
      }
    } catch (error) {
      console.error('Error updating payroll status:', error);
      alert('حدث خطأ أثناء تحديث الحالة');
    }
  };

  const handleDelete = async (payrollId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الراتب؟')) {
      try {
        const response = await fetch(`/api/hr/payroll/${payrollId}`, {
          method: 'DELETE',
        });

        const result = await response.json();

        if (result.success) {
          await fetchPayrolls();
        } else {
          alert(result.message || 'حدث خطأ أثناء الحذف');
        }
      } catch (error) {
        console.error('Error deleting payroll:', error);
        alert('حدث خطأ أثناء الحذف');
      }
    }
  };

  const generatePayslip = (payroll: Payroll) => {
    // Simple payslip generation - in a real app, you'd use a proper PDF library
    const payslipContent = `
      قسيمة راتب
      ================
      
      الموظف: ${payroll.employeeName}
      الشهر: ${months.find(m => m.value === payroll.month)?.label} ${payroll.year}
      
      تفاصيل الراتب:
      ================
      الراتب الأساسي: ₪${payroll.baseSalary.toLocaleString()}
      المكافآت: ₪${payroll.bonus.toLocaleString()}
      أجر الساعات الإضافية: ₪${payroll.overtimePay.toLocaleString()}
      الاستقطاعات: ₪${payroll.deductions.toLocaleString()}
      
      إجمالي الراتب: ₪${payroll.totalSalary.toLocaleString()}
      
      تفاصيل الحضور:
      ================
      أيام العمل: ${payroll.workingDays}
      أيام الحضور: ${payroll.presentDays}
      الساعات الإضافية: ${payroll.overtimeHours}
    `;

    const blob = new Blob([payslipContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payslip-${payroll.employeeName}-${payroll.month}-${payroll.year}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      bonus: 0,
      deductions: 0,
    });
  };

  const getPayrollStats = () => {
    const totalPayroll = payrolls.reduce((sum, p) => sum + p.totalSalary, 0);
    const totalBonus = payrolls.reduce((sum, p) => sum + p.bonus, 0);
    const totalDeductions = payrolls.reduce((sum, p) => sum + p.deductions, 0);
    const paidPayrolls = payrolls.filter(p => p.status === 'paid');

    return {
      total: payrolls.length,
      totalPayroll,
      totalBonus,
      totalDeductions,
      paidCount: paidPayrolls.length,
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800">مسودة</Badge>;
      case 'approved':
        return <Badge className="bg-blue-100 text-blue-800">معتمد</Badge>;
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">مدفوع</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const stats = getPayrollStats();

  if (isLoading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">إجمالي الرواتب</p>
                <p className="text-2xl font-bold text-slate-900">₪{stats.totalPayroll.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">إجمالي المكافآت</p>
                <p className="text-2xl font-bold text-slate-900">₪{stats.totalBonus.toLocaleString()}</p>
              </div>
              <Plus className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">إجمالي الاستقطاعات</p>
                <p className="text-2xl font-bold text-slate-900">₪{stats.totalDeductions.toLocaleString()}</p>
              </div>
              <Calculator className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">الرواتب المدفوعة</p>
                <p className="text-2xl font-bold text-slate-900">{stats.paidCount}</p>
              </div>
              <FileText className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-full sm:w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="draft">مسودة</SelectItem>
              <SelectItem value="approved">معتمد</SelectItem>
              <SelectItem value="paid">مدفوع</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 ml-2" />
              إنشاء راتب جديد
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إنشاء راتب جديد</DialogTitle>
              <DialogDescription>
                قم بإنشاء راتب شهري للموظف
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="employeeId">الموظف *</Label>
                <Select
                  value={formData.employeeId}
                  onValueChange={(value) => setFormData({...formData, year: parseInt(value) || new Date().getFullYear()})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الموظف" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee._id?.toString()} value={employee._id!.toString()}>
                        {employee.name} - ₪{employee.baseSalary.toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="month">الشهر *</Label>
                  <Select
                    value={formData.month.toString()}
                    onValueChange={(value) => setFormData({...formData, month: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="year">السنة *</Label>
                  <Select
                    value={formData.year.toString()}
                    onValueChange={(value) => setFormData({...formData, year: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bonus">المكافآت</Label>
                  <Input
                    id="bonus"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.bonus}
                    onChange={(e) => setFormData({...formData, bonus: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="deductions">الاستقطاعات</Label>
                  <Input
                    id="deductions"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.deductions}
                    onChange={(e) => setFormData({...formData, deductions: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">
                  إنشاء الراتب
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Payrolls Table */}
      <Card>
        <CardHeader>
          <CardTitle>الرواتب الشهرية</CardTitle>
          <CardDescription>
            {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payrolls.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <DollarSign className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                لا توجد رواتب
              </h3>
              <p className="mb-4">لم يتم إنشاء أي رواتب لهذا الشهر بعد</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 ml-2" />
                إنشاء راتب جديد
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الموظف</TableHead>
                    <TableHead>الراتب الأساسي</TableHead>
                    <TableHead>المكافآت</TableHead>
                    <TableHead>الساعات الإضافية</TableHead>
                    <TableHead>الاستقطاعات</TableHead>
                    <TableHead>إجمالي الراتب</TableHead>
                    <TableHead>أيام الحضور</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrolls.map((payroll) => (
                    <TableRow key={payroll._id?.toString()}>
                      <TableCell className="font-medium">{payroll.employeeName}</TableCell>
                      <TableCell>₪{payroll.baseSalary.toLocaleString()}</TableCell>
                      <TableCell>₪{payroll.bonus.toLocaleString()}</TableCell>
                      <TableCell>
                        {payroll.overtimeHours}ساعة (₪{payroll.overtimePay.toLocaleString()})
                      </TableCell>
                      <TableCell>₪{payroll.deductions.toLocaleString()}</TableCell>
                      <TableCell className="font-bold">₪{payroll.totalSalary.toLocaleString()}</TableCell>
                      <TableCell>{payroll.presentDays}/{payroll.workingDays}</TableCell>
                      <TableCell>{getStatusBadge(payroll.status)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2 space-x-reverse">
                          {payroll.status === 'draft' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(payroll._id!.toString(), 'approved')}
                            >
                              اعتماد
                            </Button>
                          )}
                          {payroll.status === 'approved' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(payroll._id!.toString(), 'paid')}
                            >
                              تأكيد الدفع
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => generatePayslip(payroll)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(payroll._id!.toString())}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}