'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Users, Building2, Mail, Phone, Edit, Trash2, Search, Filter, Shield, User, Crown } from 'lucide-react';
import { User as UserType, ModuleAccess, defaultModuleAccess, superAdminModuleAccess } from '@/lib/models/User';
import { Company } from '@/lib/models/Company';

export default function UsersManager() {
  const [users, setUsers] = useState<(UserType & { companyName?: string })[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff' as 'super-admin' | 'owner' | 'staff',
    companyId: '',
    modules: defaultModuleAccess as ModuleAccess,
  });

  useEffect(() => {
    fetchUsers();
    fetchCompanies();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/admin/companies');
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingUser 
        ? `/api/admin/users/${editingUser._id}`
        : '/api/admin/users';
      
      const method = editingUser ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        await fetchUsers();
        setIsDialogOpen(false);
        resetForm();
      } else {
        alert(result.message || 'حدث خطأ أثناء الحفظ');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      alert('حدث خطأ أثناء الحفظ');
    }
  };

  const handleEdit = (user: UserType & { companyName?: string }) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      companyId: user.companyId?.toString() || '',
      modules: user.modules,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (userId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      try {
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'DELETE',
        });

        const result = await response.json();

        if (result.success) {
          await fetchUsers();
        } else {
          alert(result.message || 'حدث خطأ أثناء الحذف');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('حدث خطأ أثناء الحذف');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'staff',
      companyId: '',
      modules: defaultModuleAccess,
    });
    setEditingUser(null);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleRoleChange = (role: 'super-admin' | 'owner' | 'staff') => {
    const modules = role === 'super-admin' ? superAdminModuleAccess : defaultModuleAccess;
    setFormData({
      ...formData,
      role,
      modules,
    });
  };

  const handleModuleChange = (module: keyof ModuleAccess, checked: boolean) => {
    setFormData({
      ...formData,
      modules: {
        ...formData.modules,
        [module]: checked,
      },
    });
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super-admin':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'owner':
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <User className="w-4 h-4 text-slate-500" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super-admin':
        return <Badge className="bg-yellow-100 text-yellow-800">مدير النظام</Badge>;
      case 'owner':
        return <Badge className="bg-blue-100 text-blue-800">مالك</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-800">موظف</Badge>;
    }
  };

  const getUserStats = () => {
    const superAdmins = users.filter(u => u.role === 'super-admin');
    const owners = users.filter(u => u.role === 'owner');
    const staff = users.filter(u => u.role === 'staff');
    const activeUsers = users.filter(u => u.isActive);

    return {
      total: users.length,
      superAdmins: superAdmins.length,
      owners: owners.length,
      staff: staff.length,
      active: activeUsers.length,
    };
  };

  const stats = getUserStats();

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
                <p className="text-sm text-slate-600">إجمالي المستخدمين</p>
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
                <p className="text-sm text-slate-600">مديري النظام</p>
                <p className="text-2xl font-bold text-slate-900">{stats.superAdmins}</p>
              </div>
              <Crown className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">الملاك</p>
                <p className="text-2xl font-bold text-slate-900">{stats.owners}</p>
              </div>
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">الموظفون</p>
                <p className="text-2xl font-bold text-slate-900">{stats.staff}</p>
              </div>
              <User className="w-8 h-8 text-slate-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="البحث في المستخدمين..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="تصفية حسب الدور" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأدوار</SelectItem>
              <SelectItem value="super-admin">مدير النظام</SelectItem>
              <SelectItem value="owner">مالك</SelectItem>
              <SelectItem value="staff">موظف</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة مستخدم جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}
              </DialogTitle>
              <DialogDescription>
                {editingUser 
                  ? 'قم بتعديل بيانات المستخدم'
                  : 'أدخل بيانات المستخدم الجديد'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">الاسم *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">البريد الإلكتروني *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    dir="ltr"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">
                    كلمة المرور {editingUser && '(اتركها فارغة للاحتفاظ بالحالية)'}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required={!editingUser}
                  />
                </div>
                <div>
                  <Label htmlFor="role">الدور *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: 'super-admin' | 'owner' | 'staff') => handleRoleChange(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">موظف</SelectItem>
                      <SelectItem value="owner">مالك</SelectItem>
                      <SelectItem value="super-admin">مدير النظام</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.role !== 'super-admin' && (
                <div>
                  <Label htmlFor="companyId">الشركة</Label>
                  <Select
                    value={formData.companyId}
                    onValueChange={(value) => setFormData({...formData, companyId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الشركة" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company._id?.toString()} value={company._id!.toString()}>
                          {company.nameAr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.role !== 'super-admin' && (
                <div>
                  <Label className="text-base font-medium">صلاحيات الوحدات</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    {Object.entries(formData.modules).map(([module, hasAccess]) => (
                      <div key={module} className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox
                          id={module}
                          checked={hasAccess}
                          onCheckedChange={(checked) => handleModuleChange(module as keyof ModuleAccess, checked as boolean)}
                        />
                        <Label htmlFor={module} className="text-sm">
                          {module === 'crm' && 'إدارة العملاء'}
                          {module === 'hr' && 'الموارد البشرية'}
                          {module === 'inventory' && 'إدارة المخزون'}
                          {module === 'sales' && 'المبيعات'}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  إلغاء
                </Button>
                <Button type="submit">
                  {editingUser ? 'تحديث' : 'إضافة'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>المستخدمون</CardTitle>
          <CardDescription>
            إدارة المستخدمين وصلاحياتهم في النظام
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                لا يوجد مستخدمون
              </h3>
              <p className="mb-4">
                {searchTerm || roleFilter !== 'all' ? 'لم يتم العثور على نتائج للبحث' : 'لم يتم إضافة أي مستخدمين بعد'}
              </p>
              {!searchTerm && roleFilter === 'all' && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة مستخدم جديد
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المستخدم</TableHead>
                    <TableHead>الدور</TableHead>
                    <TableHead>الشركة</TableHead>
                    <TableHead>صلاحيات الوحدات</TableHead>
                    <TableHead>تاريخ الإنشاء</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user._id?.toString()}>
                      <TableCell>
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                              {getRoleIcon(user.role)}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{user.name}</div>
                            <div className="text-sm text-slate-500 flex items-center">
                              <Mail className="w-3 h-3 ml-1" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-slate-600">
                          <Building2 className="w-4 h-4 ml-2" />
                          {user.companyName || 'لا توجد شركة'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(user.modules).map(([module, hasAccess]) => (
                            hasAccess && (
                              <Badge key={module} variant="secondary" className="text-xs">
                                {module === 'crm' && 'CRM'}
                                {module === 'hr' && 'HR'}
                                {module === 'inventory' && 'المخزون'}
                                {module === 'sales' && 'المبيعات'}
                              </Badge>
                            )
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {new Date(user.createdAt).toLocaleDateString('ar-SA')}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2 space-x-reverse">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(user._id!.toString())}
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