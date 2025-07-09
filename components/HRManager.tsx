'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Users, Calendar, DollarSign, Search, Edit, Trash2, Clock, UserCheck } from 'lucide-react';
import { Employee, EmployeeFormData, Attendance, AttendanceFormData } from '@/lib/models/HR';

interface HRManagerProps {
  userRole: string;
  companyId?: string;
}

export default function HRManager({ userRole, companyId }: HRManagerProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEmployeeDialogOpen, setIsEmployeeDialogOpen] = useState(false);
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState('employees');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [employeeFormData, setEmployeeFormData] = useState<EmployeeFormData>({
    name: '',
    phone: '',
    email: '',
    role: '',
    department: '',
    baseSalary: 0,
    hireDate: '',
    status: 'active',
  });

  const [attendanceFormData, setAttendanceFormData] = useState<AttendanceFormData>({
    employeeId: '',
    date: '',
    checkIn: '',
    checkOut: '',
    status: 'present',
    notes: '',
  });

  const commonRoles = ['مطور', 'مصمم', 'مدير مشروع', 'محاسب', 'مسوق', 'موظف خدمة عملاء', 'مدير', 'أخرى'];
  const commonDepartments = ['تقنية المعلومات', 'التسويق', 'المحاسبة', 'الموارد البشرية', 'المبيعات', 'خدمة العملاء', 'الإدارة', 'أخرى'];

  useEffect(() => {
    fetchEmployees();
    fetchAttendance();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchTerm, statusFilter]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/hr/employees');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      
      const response = await fetch(`/api/hr/attendance?month=${month}&year=${year}`);
      if (response.ok) {
        const data = await response.json();
        setAttendance(data);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const filterEmployees = () => {
    let filtered = employees;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(employee => employee.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(employee =>
        employee.name.toLowerCase().includes(term) ||
        employee.employeeId.toLowerCase().includes(term) ||
        employee.email.toLowerCase().includes(term) ||
        employee.role.toLowerCase().includes(term)
      );
    }

    setFilteredEmployees(filtered);
  };

  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingEmployee 
        ? `/api/hr/employees/${editingEmployee._id}`
        : '/api/hr/employees';
      
      const method = editingEmployee ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(employeeFormData),
      });

      const result = await response.json();

      if (result.success) {
        await fetchEmployees();
        setIsEmployeeDialogOpen(false);
        resetEmployeeForm();
        if (!editingEmployee) {
          alert(`تم إنشاء الموظف بنجاح - رقم الموظف: ${result.employeeId}`);
        }
      } else {
        alert(result.message || 'حدث خطأ أثناء الحفظ');
      }
    } catch (error) {
      console.error('Error saving employee:', error);
      alert('حدث خطأ أثناء الحفظ');
    }
  };

  const handleAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/hr/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(attendanceFormData),
      });

      const result = await response.json();

      if (result.success) {
        await fetchAttendance();
        setIsAttendanceDialogOpen(false);
        resetAttendanceForm();
      } else {
        alert(result.message || 'حدث خطأ أثناء تسجيل الحضور');
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('حدث خطأ أثناء تسجيل الحضور');
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setEmployeeFormData({
      name: employee.name,
      phone: employee.phone,
      email: employee.email,
      role: employee.role,
      department: employee.department,
      baseSalary: employee.baseSalary,
      hireDate: employee.hireDate.toString().split('T')[0],
      status: employee.status,
    });
    setIsEmployeeDialogOpen(true);
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الموظف؟')) {
      try {
        const response = await fetch(`/api/hr/employees/${employeeId}`, {
          method: 'DELETE',
        });

        const result = await response.json();

        if (result.success) {
          await fetchEmployees();
        } else {
          alert(result.message || 'حدث خطأ أثناء الحذف');
        }
      } catch (error) {
        console.error('Error deleting employee:', error);
        alert('حدث خطأ أثناء الحذف');
      }
    }
  };

  const resetEmployeeForm = () => {
    setEmployeeFormData({
      name: '',
      phone: '',
      email: '',
      role: '',
      department: '',
      baseSalary: 0,
      hireDate: '',
      status: 'active',
    });
    setEditingEmployee(null);
  };

  const resetAttendanceForm = () => {
    setAttendanceFormData({
      employeeId: '',
      date: '',
      checkIn: '',
      checkOut: '',
      status: 'present',
      notes: '',
    });
  };

  const getEmployeeStats = () => {
    const active = employees.filter(e => e.status === 'active');
    const inactive = employees.filter(e => e.status === 'inactive');
    const terminated = employees.filter(e => e.status === 'terminated');
    const totalSalaries = active.reduce((sum, e) => sum + e.baseSalary, 0);

    return {
      total: employees.length,
      active: active.length,
      inactive: inactive.length,
      terminated: terminated.length,
      totalSalaries,
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">نشط</Badge>;
      case 'inactive':
        return <Badge className="bg-yellow-100 text-yellow-800">غير نشط</Badge>;
      case 'terminated':
        return <Badge className="bg-red-100 text-red-800">منتهي الخدمة</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getAttendanceStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-800">حاضر</Badge>;
      case 'absent':
        return <Badge className="bg-red-100 text-red-800">غائب</Badge>;
      case 'late':
        return <Badge className="bg-yellow-100 text-yellow-800">متأخر</Badge>;
      case 'half-day':
        return <Badge className="bg-blue-100 text-blue-800">نصف يوم</Badge>;
      case 'holiday':
        return <Badge className="bg-purple-100 text-purple-800">إجازة</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const stats = getEmployeeStats();

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
                <p className="text-sm text-slate-600">إجمالي الموظفين</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">الموظفون النشطون</p>
                <p className="text-2xl font-bold text-slate-900">{stats.active}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">إجمالي الرواتب</p>
                <p className="text-2xl font-bold text-slate-900">₪{stats.totalSalaries.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">سجلات الحضور اليوم</p>
                <p className="text-2xl font-bold text-slate-900">{attendance.filter(a => 
                  new Date(a.date).toDateString() === new Date().toDateString()
                ).length}</p>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>إدارة الموارد البشرية</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="employees">الموظفون ({stats.total})</TabsTrigger>
              <TabsTrigger value="attendance">الحضور والانصراف</TabsTrigger>
            </TabsList>
            
            <TabsContent value="employees" className="mt-6">
              {/* Controls */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="البحث في الموظفين..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full sm:w-64"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="تصفية حسب الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الحالات</SelectItem>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="inactive">غير نشط</SelectItem>
                      <SelectItem value="terminated">منتهي الخدمة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Dialog open={isEmployeeDialogOpen} onOpenChange={setIsEmployeeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setIsEmployeeDialogOpen(true)}>
                      <Plus className="w-4 h-4 ml-2" />
                      إضافة موظف جديد
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingEmployee ? 'تعديل الموظف' : 'إضافة موظف جديد'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingEmployee 
                          ? 'قم بتعديل بيانات الموظف'
                          : 'أدخل بيانات الموظف الجديد'
                        }
                      </DialogDescription>
                    </DialogHeader>
                    
                    <form onSubmit={handleEmployeeSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">الاسم *</Label>
                          <Input
                            id="name"
                            value={employeeFormData.name}
                            onChange={(e) => setEmployeeFormData({...employeeFormData, name: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">رقم الهاتف *</Label>
                          <Input
                            id="phone"
                            value={employeeFormData.phone}
                            onChange={(e) => setEmployeeFormData({...employeeFormData, phone: e.target.value})}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="email">البريد الإلكتروني *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={employeeFormData.email}
                            onChange={(e) => setEmployeeFormData({...employeeFormData, email: e.target.value})}
                            required
                            dir="ltr"
                          />
                        </div>
                        <div>
                          <Label htmlFor="role">المنصب *</Label>
                          <Select
                            value={employeeFormData.role}
                            onValueChange={(value) => setEmployeeFormData({...employeeFormData, role: value || ''})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="اختر المنصب" />
                            </SelectTrigger>
                            <SelectContent>
                              {commonRoles.map((role) => (
                                <SelectItem key={role} value={role}>
                                  {role}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="department">القسم</Label>
                          <Select
                            value={employeeFormData.department}
                            onValueChange={(value) => setEmployeeFormData({...employeeFormData, department: value || ''})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="اختر القسم" />
                            </SelectTrigger>
                            <SelectContent>
                              {commonDepartments.map((dept) => (
                                <SelectItem key={dept} value={dept}>
                                  {dept}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="baseSalary">الراتب الأساسي</Label>
                          <Input
                            id="baseSalary"
                            type="number"
                            min="0"
                            step="0.01"
                            value={employeeFormData.baseSalary}
                            onChange={(e) => setEmployeeFormData({...employeeFormData, baseSalary: parseFloat(e.target.value) || 0})}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="hireDate">تاريخ التوظيف</Label>
                          <Input
                            id="hireDate"
                            type="date"
                            value={employeeFormData.hireDate}
                            onChange={(e) => setEmployeeFormData({...employeeFormData, hireDate: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="status">الحالة</Label>
                          <Select
                            value={employeeFormData.status}
                            onValueChange={(value: 'active' | 'inactive' | 'terminated') => setEmployeeFormData({...employeeFormData, status: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">نشط</SelectItem>
                              <SelectItem value="inactive">غير نشط</SelectItem>
                              <SelectItem value="terminated">منتهي الخدمة</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsEmployeeDialogOpen(false)}>
                          إلغاء
                        </Button>
                        <Button type="submit">
                          {editingEmployee ? 'تحديث' : 'إضافة'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Employees Table */}
              {filteredEmployees.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    لا يوجد موظفون
                  </h3>
                  <p className="mb-4">
                    {searchTerm || statusFilter ? 'لم يتم العثور على نتائج للبحث' : 'لم يتم إضافة أي موظفين بعد'}
                  </p>
                  {!searchTerm && !statusFilter && (
                    <Button onClick={() => setIsEmployeeDialogOpen(true)}>
                      <Plus className="w-4 h-4 ml-2" />
                      إضافة موظف جديد
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>رقم الموظف</TableHead>
                        <TableHead>الاسم</TableHead>
                        <TableHead>المنصب</TableHead>
                        <TableHead>القسم</TableHead>
                        <TableHead>الراتب الأساسي</TableHead>
                        <TableHead>تاريخ التوظيف</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmployees.map((employee) => (
                        <TableRow key={employee._id?.toString()}>
                          <TableCell className="font-medium">{employee.employeeId}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{employee.name}</div>
                              <div className="text-sm text-slate-500">{employee.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>{employee.role}</TableCell>
                          <TableCell>{employee.department}</TableCell>
                          <TableCell>₪{employee.baseSalary.toLocaleString()}</TableCell>
                          <TableCell>{new Date(employee.hireDate).toLocaleDateString('ar-SA')}</TableCell>
                          <TableCell>{getStatusBadge(employee.status)}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2 space-x-reverse">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditEmployee(employee)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteEmployee(employee._id!.toString())}
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
            </TabsContent>

            <TabsContent value="attendance" className="mt-6">
              {/* Attendance Controls */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">سجلات الحضور والانصراف</h3>
                
                <Dialog open={isAttendanceDialogOpen} onOpenChange={setIsAttendanceDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setIsAttendanceDialogOpen(true)}>
                      <Plus className="w-4 h-4 ml-2" />
                      تسجيل حضور
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>تسجيل حضور وانصراف</DialogTitle>
                      <DialogDescription>
                        قم بتسجيل حضور وانصراف الموظف
                      </DialogDescription>
                    </DialogHeader>
                    
                    <form onSubmit={handleAttendanceSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="employeeId">الموظف *</Label>
                        <Select
                          value={attendanceFormData.employeeId}
                          onValueChange={(value) => setAttendanceFormData({...attendanceFormData, employeeId: value || ''})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الموظف" />
                          </SelectTrigger>
                          <SelectContent>
                            {employees.filter(e => e.status === 'active').map((employee) => (
                              <SelectItem key={employee._id?.toString()} value={employee._id!.toString()}>
                                {employee.name} - {employee.employeeId}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="date">التاريخ *</Label>
                          <Input
                            id="date"
                            type="date"
                            value={attendanceFormData.date}
                            onChange={(e) => setAttendanceFormData({...attendanceFormData, date: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="status">الحالة *</Label>
                          <Select
                            value={attendanceFormData.status}
                            onValueChange={(value: 'present' | 'absent' | 'late' | 'half-day' | 'holiday') => setAttendanceFormData({...attendanceFormData, status: value || 'present'})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="present">حاضر</SelectItem>
                              <SelectItem value="absent">غائب</SelectItem>
                              <SelectItem value="late">متأخر</SelectItem>
                              <SelectItem value="half-day">نصف يوم</SelectItem>
                              <SelectItem value="holiday">إجازة</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {attendanceFormData.status === 'present' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="checkIn">وقت الحضور</Label>
                            <Input
                              id="checkIn"
                              type="time"
                              value={attendanceFormData.checkIn}
                              onChange={(e) => setAttendanceFormData({...attendanceFormData, checkIn: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="checkOut">وقت الانصراف</Label>
                            <Input
                              id="checkOut"
                              type="time"
                              value={attendanceFormData.checkOut}
                              onChange={(e) => setAttendanceFormData({...attendanceFormData, checkOut: e.target.value})}
                            />
                          </div>
                        </div>
                      )}

                      <div>
                        <Label htmlFor="notes">ملاحظات</Label>
                        <Input
                          id="notes"
                          value={attendanceFormData.notes}
                          onChange={(e) => setAttendanceFormData({...attendanceFormData, notes: e.target.value})}
                          placeholder="ملاحظات إضافية..."
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsAttendanceDialogOpen(false)}>
                          إلغاء
                        </Button>
                        <Button type="submit">
                          تسجيل
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Attendance Table */}
              {attendance.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    لا توجد سجلات حضور
                  </h3>
                  <p className="mb-4">لم يتم تسجيل أي حضور بعد</p>
                  <Button onClick={() => setIsAttendanceDialogOpen(true)}>
                    <Plus className="w-4 h-4 ml-2" />
                    تسجيل حضور جديد
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الموظف</TableHead>
                        <TableHead>التاريخ</TableHead>
                        <TableHead>وقت الحضور</TableHead>
                        <TableHead>وقت الانصراف</TableHead>
                        <TableHead>إجمالي الساعات</TableHead>
                        <TableHead>الساعات الإضافية</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>ملاحظات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendance.map((record) => (
                        <TableRow key={record._id?.toString()}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{record.employeeName}</div>
                              <div className="text-sm text-slate-500">{record.employeeCode}</div>
                            </div>
                          </TableCell>
                          <TableCell>{new Date(record.date).toLocaleDateString('ar-SA')}</TableCell>
                          <TableCell>
                            {record.checkIn ? new Date(record.checkIn).toLocaleTimeString('ar-SA', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            }) : '-'}
                          </TableCell>
                          <TableCell>
                            {record.checkOut ? new Date(record.checkOut).toLocaleTimeString('ar-SA', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            }) : '-'}
                          </TableCell>
                          <TableCell>{record.totalHours.toFixed(2)} ساعة</TableCell>
                          <TableCell>{record.overtimeHours.toFixed(2)} ساعة</TableCell>
                          <TableCell>{getAttendanceStatusBadge(record.status)}</TableCell>
                          <TableCell>{record.notes || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}