'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Building2, Mail, Phone, MapPin, Edit, Trash2 } from 'lucide-react';
import { Company } from '@/lib/models/Company';

export default function CompaniesManager() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    email: '',
    phone: '',
    address: '',
    addressAr: '',
    industry: '',
    industryAr: '',
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/admin/companies');
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingCompany 
        ? `/api/admin/companies/${editingCompany._id}`
        : '/api/admin/companies';
      
      const method = editingCompany ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchCompanies();
        setIsDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error saving company:', error);
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      nameAr: company.nameAr,
      email: company.email,
      phone: company.phone,
      address: company.address,
      addressAr: company.addressAr,
      industry: company.industry,
      industryAr: company.industryAr,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (companyId: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الشركة؟')) {
      try {
        const response = await fetch(`/api/admin/companies/${companyId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await fetchCompanies();
        }
      } catch (error) {
        console.error('Error deleting company:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      nameAr: '',
      email: '',
      phone: '',
      address: '',
      addressAr: '',
      industry: '',
      industryAr: '',
    });
    setEditingCompany(null);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  if (isLoading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">الشركات المسجلة</h2>
          <p className="text-slate-600">عدد الشركات: {companies.length}</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة شركة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCompany ? 'تعديل الشركة' : 'إضافة شركة جديدة'}
              </DialogTitle>
              <DialogDescription>
                {editingCompany 
                  ? 'قم بتعديل بيانات الشركة'
                  : 'أدخل بيانات الشركة الجديدة'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">اسم الشركة (إنجليزي)</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label htmlFor="nameAr">اسم الشركة (عربي)</Label>
                  <Input
                    id="nameAr"
                    value={formData.nameAr}
                    onChange={(e) => setFormData({...formData, nameAr: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="address">العنوان (إنجليزي)</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    required
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label htmlFor="addressAr">العنوان (عربي)</Label>
                  <Input
                    id="addressAr"
                    value={formData.addressAr}
                    onChange={(e) => setFormData({...formData, addressAr: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="industry">القطاع (إنجليزي)</Label>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => setFormData({...formData, industry: e.target.value})}
                    required
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label htmlFor="industryAr">القطاع (عربي)</Label>
                  <Input
                    id="industryAr"
                    value={formData.industryAr}
                    onChange={(e) => setFormData({...formData, industryAr: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  إلغاء
                </Button>
                <Button type="submit">
                  {editingCompany ? 'تحديث' : 'إضافة'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((company) => (
          <Card key={company._id?.toString()} className="hover:shadow-lg transition-shadow h-full">
            <CardHeader className="pb-3 p-4 md:p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="bg-primary text-primary-foreground p-2 rounded-lg flex-shrink-0">
                    <Building2 className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base md:text-lg truncate">{company.nameAr}</CardTitle>
                    <CardDescription className="text-xs md:text-sm truncate">{company.name}</CardDescription>
                  </div>
                </div>
                <Badge variant={company.isActive ? "default" : "secondary"}>
                  {company.isActive ? 'نشط' : 'غير نشط'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 p-4 md:p-6 pt-0">
              <div className="flex items-center space-x-2 space-x-reverse text-sm text-slate-600">
                <Mail className="w-4 h-4" />
                <span className="truncate">{company.email}</span>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse text-sm text-slate-600">
                <Phone className="w-4 h-4" />
                <span className="truncate">{company.phone}</span>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse text-sm text-slate-600">
                <MapPin className="w-4 h-4" />
                <span className="truncate">{company.addressAr}</span>
              </div>
              <div className="text-sm text-slate-500">
                <span className="truncate">القطاع: {company.industryAr}</span>
              </div>
              
              <div className="flex justify-end space-x-2 space-x-reverse pt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(company)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(company._id!.toString())}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}