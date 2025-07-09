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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, FileText, DollarSign, CreditCard, Search, Edit, Trash2, Eye, Calendar } from 'lucide-react';
import { Invoice, InvoiceFormData, InvoiceLineItem } from '@/lib/models/Invoice';
import { Contact } from '@/lib/models/CRM';

interface SalesManagerProps {
  userRole: string;
  companyId?: string;
}

export default function SalesManager({ userRole, companyId }: SalesManagerProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Contact[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<InvoiceFormData>({
    customerId: '',
    lineItems: [{ productName: '', quantity: 1, unitPrice: 0, taxPercent: 0, total: 0 }],
    dueDate: '',
    notes: '',
  });

  const [paymentAmount, setPaymentAmount] = useState(0);

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [invoices, activeTab, searchTerm]);

  const fetchInvoices = async () => {
    try {
      const response = await fetch('/api/sales');
      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/crm?type=customer');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const filterInvoices = () => {
    let filtered = invoices;

    // Filter by status
    if (activeTab !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === activeTab);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(invoice =>
        invoice.invoiceNumber.toLowerCase().includes(term) ||
        invoice.customerName.toLowerCase().includes(term) ||
        invoice.customerEmail.toLowerCase().includes(term)
      );
    }

    setFilteredInvoices(filtered);
  };

  const calculateLineItemTotal = (item: InvoiceLineItem) => {
    const subtotal = item.quantity * item.unitPrice;
    const tax = (subtotal * item.taxPercent) / 100;
    return subtotal + tax;
  };

  const updateLineItem = (index: number, field: keyof InvoiceLineItem, value: any) => {
    const newLineItems = [...formData.lineItems];
    newLineItems[index] = { ...newLineItems[index], [field]: value };
    
    // Recalculate total for this line item
    newLineItems[index].total = calculateLineItemTotal(newLineItems[index]);
    
    setFormData({ ...formData, lineItems: newLineItems });
  };

  const addLineItem = () => {
    setFormData({
      ...formData,
      lineItems: [...formData.lineItems, { productName: '', quantity: 1, unitPrice: 0, taxPercent: 0, total: 0 }]
    });
  };

  const removeLineItem = (index: number) => {
    if (formData.lineItems.length > 1) {
      const newLineItems = formData.lineItems.filter((_, i) => i !== index);
      setFormData({ ...formData, lineItems: newLineItems });
    }
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalTax = 0;

    formData.lineItems.forEach(item => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemTax = (itemSubtotal * item.taxPercent) / 100;
      subtotal += itemSubtotal;
      totalTax += itemTax;
    });

    return {
      subtotal,
      totalTax,
      grandTotal: subtotal + totalTax
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        await fetchInvoices();
        setIsDialogOpen(false);
        resetForm();
        alert(`تم إنشاء الفاتورة بنجاح - رقم الفاتورة: ${result.invoiceNumber}`);
      } else {
        alert(result.message || 'حدث خطأ أثناء إنشاء الفاتورة');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('حدث خطأ أثناء إنشاء الفاتورة');
    }
  };

  const handlePayment = async () => {
    if (!selectedInvoice || paymentAmount <= 0) return;

    try {
      const newPaidAmount = selectedInvoice.paidAmount + paymentAmount;
      
      const response = await fetch(`/api/sales/${selectedInvoice._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paidAmount: newPaidAmount
        }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchInvoices();
        setIsPaymentDialogOpen(false);
        setPaymentAmount(0);
        setSelectedInvoice(null);
        alert('تم تسجيل الدفعة بنجاح');
      } else {
        alert(result.message || 'حدث خطأ أثناء تسجيل الدفعة');
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('حدث خطأ أثناء تسجيل الدفعة');
    }
  };

  const handleDelete = async (invoiceId: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) {
      try {
        const response = await fetch(`/api/sales/${invoiceId}`, {
          method: 'DELETE',
        });

        const result = await response.json();

        if (result.success) {
          await fetchInvoices();
        } else {
          alert(result.message || 'حدث خطأ أثناء الحذف');
        }
      } catch (error) {
        console.error('Error deleting invoice:', error);
        alert('حدث خطأ أثناء الحذف');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      customerId: '',
      lineItems: [{ productName: '', quantity: 1, unitPrice: 0, taxPercent: 0, total: 0 }],
      dueDate: '',
      notes: '',
    });
  };

  const getInvoiceStats = () => {
    const paid = invoices.filter(i => i.status === 'paid');
    const partiallyPaid = invoices.filter(i => i.status === 'partially_paid');
    const unpaid = invoices.filter(i => i.status === 'unpaid');
    const totalRevenue = invoices.reduce((sum, i) => sum + i.paidAmount, 0);
    const pendingAmount = invoices.reduce((sum, i) => sum + i.remainingAmount, 0);

    return {
      total: invoices.length,
      paid: paid.length,
      partiallyPaid: partiallyPaid.length,
      unpaid: unpaid.length,
      totalRevenue,
      pendingAmount,
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">مدفوعة</Badge>;
      case 'partially_paid':
        return <Badge className="bg-yellow-100 text-yellow-800">مدفوعة جزئياً</Badge>;
      case 'unpaid':
        return <Badge className="bg-red-100 text-red-800">غير مدفوعة</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const stats = getInvoiceStats();
  const totals = calculateTotals();

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
                <p className="text-sm text-slate-600">إجمالي الفواتير</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">الإيرادات المحصلة</p>
                <p className="text-2xl font-bold text-slate-900">₪{stats.totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">المبالغ المعلقة</p>
                <p className="text-2xl font-bold text-slate-900">₪{stats.pendingAmount.toLocaleString()}</p>
              </div>
              <CreditCard className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">الفواتير المدفوعة</p>
                <p className="text-2xl font-bold text-slate-900">{stats.paid}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 font-bold">✓</span>
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
              placeholder="البحث في الفواتير..."
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
              إنشاء فاتورة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إنشاء فاتورة جديدة</DialogTitle>
              <DialogDescription>
                أدخل بيانات الفاتورة وعناصرها
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer">العميل *</Label>
                  <Select
                    value={formData.customerId}
                    onValueChange={(value) => setFormData({...formData, customerId: value || ''})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر العميل" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer._id?.toString()} value={customer._id!.toString()}>
                          {customer.name} - {customer.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dueDate">تاريخ الاستحقاق *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                    required
                  />
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <Label className="text-base font-medium">عناصر الفاتورة</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة عنصر
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {formData.lineItems.map((item, index) => (
                    <Card key={index} className="p-4">
                      <div className="grid grid-cols-12 gap-4 items-end">
                        <div className="col-span-4">
                          <Label>اسم المنتج/الخدمة</Label>
                          <Input
                            value={item.productName}
                            onChange={(e) => updateLineItem(index, 'productName', e.target.value)}
                            placeholder="اسم المنتج أو الخدمة"
                            required
                          />
                        </div>
                        <div className="col-span-2">
                          <Label>الكمية</Label>
                          <Input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            required
                          />
                        </div>
                        <div className="col-span-2">
                          <Label>السعر</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            required
                          />
                        </div>
                        <div className="col-span-2">
                          <Label>الضريبة %</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={item.taxPercent}
                            onChange={(e) => updateLineItem(index, 'taxPercent', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="col-span-1">
                          <Label>المجموع</Label>
                          <div className="text-sm font-medium p-2 bg-slate-50 rounded">
                            ₪{item.total.toFixed(2)}
                          </div>
                        </div>
                        <div className="col-span-1">
                          {formData.lineItems.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeLineItem(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Totals */}
                <Card className="mt-4 p-4 bg-slate-50">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>المجموع الفرعي:</span>
                      <span>₪{totals.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>إجمالي الضرائب:</span>
                      <span>₪{totals.totalTax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>المجموع الكلي:</span>
                      <span>₪{totals.grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </Card>
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
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">
                  إنشاء الفاتورة
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle>الفواتير</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">الكل ({stats.total})</TabsTrigger>
              <TabsTrigger value="paid">مدفوعة ({stats.paid})</TabsTrigger>
              <TabsTrigger value="partially_paid">جزئية ({stats.partiallyPaid})</TabsTrigger>
              <TabsTrigger value="unpaid">غير مدفوعة ({stats.unpaid})</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-6">
              {filteredInvoices.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    لا توجد فواتير
                  </h3>
                  <p className="mb-4">
                    {searchTerm ? 'لم يتم العثور على نتائج للبحث' : 'لم يتم إنشاء أي فواتير بعد'}
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => setIsDialogOpen(true)}>
                      <Plus className="w-4 h-4 ml-2" />
                      إنشاء فاتورة جديدة
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>رقم الفاتورة</TableHead>
                        <TableHead>العميل</TableHead>
                        <TableHead>تاريخ الإصدار</TableHead>
                        <TableHead>تاريخ الاستحقاق</TableHead>
                        <TableHead>المبلغ الكلي</TableHead>
                        <TableHead>المبلغ المدفوع</TableHead>
                        <TableHead>المبلغ المتبقي</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((invoice) => (
                        <TableRow key={invoice._id?.toString()}>
                          <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{invoice.customerName}</div>
                              <div className="text-sm text-slate-500">{invoice.customerEmail}</div>
                            </div>
                          </TableCell>
                          <TableCell>{new Date(invoice.issueDate).toLocaleDateString('ar-SA')}</TableCell>
                          <TableCell>{new Date(invoice.dueDate).toLocaleDateString('ar-SA')}</TableCell>
                          <TableCell>₪{invoice.grandTotal.toLocaleString()}</TableCell>
                          <TableCell>₪{invoice.paidAmount.toLocaleString()}</TableCell>
                          <TableCell>₪{invoice.remainingAmount.toLocaleString()}</TableCell>
                          <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2 space-x-reverse">
                              {invoice.status !== 'paid' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedInvoice(invoice);
                                    setPaymentAmount(invoice.remainingAmount);
                                    setIsPaymentDialogOpen(true);
                                  }}
                                >
                                  <DollarSign className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(invoice._id!.toString())}
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
          </Tabs>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تسجيل دفعة</DialogTitle>
            <DialogDescription>
              تسجيل دفعة للفاتورة {selectedInvoice?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>المبلغ الكلي:</span>
                  <span>₪{selectedInvoice.grandTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>المبلغ المدفوع:</span>
                  <span>₪{selectedInvoice.paidAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>المبلغ المتبقي:</span>
                  <span>₪{selectedInvoice.remainingAmount.toLocaleString()}</span>
                </div>
              </div>
              
              <div>
                <Label htmlFor="paymentAmount">مبلغ الدفعة</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  min="0.01"
                  max={selectedInvoice.remainingAmount}
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                />
              </div>
              
              <div className="flex justify-end space-x-2 space-x-reverse">
                <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handlePayment}>
                  تسجيل الدفعة
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}