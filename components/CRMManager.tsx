'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Users, Building, Mail, Phone, MapPin, Edit, Trash2, Search, Filter } from 'lucide-react';
import { Contact, ContactFormData } from '@/lib/models/CRM';

interface CRMManagerProps {
  userRole: string;
  companyId?: string;
}

export default function CRMManager({ userRole, companyId }: CRMManagerProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    phone: '',
    email: '',
    address: '',
    type: 'customer',
    notes: '',
    balance: 0,
  });

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    filterContacts();
  }, [contacts, activeTab, searchTerm]);

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/crm');
      if (response.ok) {
        const data = await response.json();
        setContacts(data);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterContacts = () => {
    let filtered = contacts;

    // Filter by type
    if (activeTab !== 'all') {
      filtered = filtered.filter(contact => contact.type === activeTab);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(contact =>
        contact.name.toLowerCase().includes(term) ||
        contact.email.toLowerCase().includes(term) ||
        contact.phone.includes(term)
      );
    }

    setFilteredContacts(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingContact 
        ? `/api/crm/${editingContact._id}`
        : '/api/crm';
      
      const method = editingContact ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        await fetchContacts();
        setIsDialogOpen(false);
        resetForm();
      } else {
        alert(result.message || 'حدث خطأ أثناء الحفظ');
      }
    } catch (error) {
      console.error('Error saving contact:', error);
      alert('حدث خطأ أثناء الحفظ');
    }
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
      address: contact.address,
      type: contact.type,
      notes: contact.notes || '',
      balance: contact.balance,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (contactId: string) => {
    if (confirm('هل أنت متأكد من حذف جهة الاتصال هذه؟')) {
      try {
        const response = await fetch(`/api/crm/${contactId}`, {
          method: 'DELETE',
        });

        const result = await response.json();

        if (result.success) {
          await fetchContacts();
        } else {
          alert(result.message || 'حدث خطأ أثناء الحذف');
        }
      } catch (error) {
        console.error('Error deleting contact:', error);
        alert('حدث خطأ أثناء الحذف');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      type: 'customer',
      notes: '',
      balance: 0,
    });
    setEditingContact(null);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const getContactStats = () => {
    const customers = contacts.filter(c => c.type === 'customer');
    const suppliers = contacts.filter(c => c.type === 'supplier');
    const totalBalance = contacts.reduce((sum, c) => sum + c.balance, 0);

    return {
      total: contacts.length,
      customers: customers.length,
      suppliers: suppliers.length,
      totalBalance,
    };
  };

  const stats = getContactStats();

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
                <p className="text-sm text-slate-600">إجمالي جهات الاتصال</p>
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
                <p className="text-sm text-slate-600">العملاء</p>
                <p className="text-2xl font-bold text-slate-900">{stats.customers}</p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">الموردون</p>
                <p className="text-2xl font-bold text-slate-900">{stats.suppliers}</p>
              </div>
              <Building className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">إجمالي الأرصدة</p>
                <p className="text-2xl font-bold text-slate-900">₪{stats.totalBalance.toLocaleString()}</p>
              </div>
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 font-bold">₪</span>
              </div>
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
              placeholder="البحث في جهات الاتصال..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة جهة اتصال
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingContact ? 'تعديل جهة الاتصال' : 'إضافة جهة اتصال جديدة'}
              </DialogTitle>
              <DialogDescription>
                {editingContact 
                  ? 'قم بتعديل بيانات جهة الاتصال'
                  : 'أدخل بيانات جهة الاتصال الجديدة'
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
                  <Label htmlFor="type">النوع *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: 'customer' | 'supplier') => setFormData({...formData, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">عميل</SelectItem>
                      <SelectItem value="supplier">مورد</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">رقم الهاتف *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
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
              
              <div>
                <Label htmlFor="address">العنوان</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="balance">الرصيد</Label>
                <Input
                  id="balance"
                  type="number"
                  step="0.01"
                  value={formData.balance}
                  onChange={(e) => setFormData({...formData, balance: parseFloat(e.target.value) || 0})}
                />
              </div>
              
              <div>
                <Label htmlFor="notes">ملاحظات</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  إلغاء
                </Button>
                <Button type="submit">
                  {editingContact ? 'تحديث' : 'إضافة'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Contacts List */}
      <Card>
        <CardHeader>
          <CardTitle>جهات الاتصال</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">الكل ({stats.total})</TabsTrigger>
              <TabsTrigger value="customer">العملاء ({stats.customers})</TabsTrigger>
              <TabsTrigger value="supplier">الموردون ({stats.suppliers})</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-6">
              {filteredContacts.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    لا توجد جهات اتصال
                  </h3>
                  <p className="mb-4">
                    {searchTerm ? 'لم يتم العثور على نتائج للبحث' : 'لم يتم إضافة أي جهات اتصال بعد'}
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => setIsDialogOpen(true)}>
                      <Plus className="w-4 h-4 ml-2" />
                      إضافة جهة اتصال جديدة
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredContacts.map((contact) => (
                    <Card key={contact._id?.toString()} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <div className={`p-2 rounded-lg ${
                              contact.type === 'customer' 
                                ? 'bg-green-100 text-green-600' 
                                : 'bg-purple-100 text-purple-600'
                            }`}>
                              {contact.type === 'customer' ? (
                                <Users className="w-5 h-5" />
                              ) : (
                                <Building className="w-5 h-5" />
                              )}
                            </div>
                            <div>
                              <CardTitle className="text-lg">{contact.name}</CardTitle>
                              <CardDescription>
                                <Badge variant={contact.type === 'customer' ? 'default' : 'secondary'}>
                                  {contact.type === 'customer' ? 'عميل' : 'مورد'}
                                </Badge>
                              </CardDescription>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center space-x-2 space-x-reverse text-sm text-slate-600">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{contact.email}</span>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse text-sm text-slate-600">
                          <Phone className="w-4 h-4" />
                          <span>{contact.phone}</span>
                        </div>
                        {contact.address && (
                          <div className="flex items-center space-x-2 space-x-reverse text-sm text-slate-600">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate">{contact.address}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">الرصيد:</span>
                          <span className={`font-semibold ${
                            contact.balance > 0 ? 'text-green-600' : 
                            contact.balance < 0 ? 'text-red-600' : 'text-slate-600'
                          }`}>
                            ₪{contact.balance.toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="flex justify-end space-x-2 space-x-reverse pt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(contact)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(contact._id!.toString())}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}