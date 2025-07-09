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
import { Plus, Package, AlertTriangle, TrendingUp, TrendingDown, Search, Edit, Trash2, Filter } from 'lucide-react';
import { Product, ProductFormData } from '@/lib/models/Product';

interface InventoryManagerProps {
  userRole: string;
  companyId?: string;
}

export default function InventoryManager({ userRole, companyId }: InventoryManagerProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    sku: '',
    category: '',
    unit: '',
    quantity: 0,
    purchasePrice: 0,
    salePrice: 0,
    lowStockAlert: 0,
    description: '',
  });

  const commonUnits = ['قطعة', 'كيلو', 'لتر', 'متر', 'صندوق', 'علبة', 'حبة', 'زجاجة'];
  const commonCategories = ['إلكترونيات', 'ملابس', 'طعام ومشروبات', 'أدوات منزلية', 'كتب', 'رياضة', 'صحة وجمال', 'أخرى'];

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
    extractCategories();
  }, [products, activeTab, searchTerm, selectedCategory]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/inventory');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const extractCategories = () => {
    const uniqueCategories = Array.from(new Set(products.map(p => p.category)));
    setCategories(uniqueCategories);
  };

  const filterProducts = () => {
    let filtered = products;

    // Filter by stock status
    if (activeTab === 'low-stock') {
      filtered = filtered.filter(product => product.quantity <= product.lowStockAlert);
    } else if (activeTab === 'out-of-stock') {
      filtered = filtered.filter(product => product.quantity === 0);
    }

    // Filter by category
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(term) ||
        product.sku.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term)
      );
    }

    setFilteredProducts(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingProduct 
        ? `/api/inventory/${editingProduct._id}`
        : '/api/inventory';
      
      const method = editingProduct ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        await fetchProducts();
        setIsDialogOpen(false);
        resetForm();
      } else {
        alert(result.message || 'حدث خطأ أثناء الحفظ');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert('حدث خطأ أثناء الحفظ');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category,
      unit: product.unit,
      quantity: product.quantity,
      purchasePrice: product.purchasePrice,
      salePrice: product.salePrice,
      lowStockAlert: product.lowStockAlert,
      description: product.description || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (productId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      try {
        const response = await fetch(`/api/inventory/${productId}`, {
          method: 'DELETE',
        });

        const result = await response.json();

        if (result.success) {
          await fetchProducts();
        } else {
          alert(result.message || 'حدث خطأ أثناء الحذف');
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('حدث خطأ أثناء الحذف');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      category: '',
      unit: '',
      quantity: 0,
      purchasePrice: 0,
      salePrice: 0,
      lowStockAlert: 0,
      description: '',
    });
    setEditingProduct(null);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const getInventoryStats = () => {
    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => p.quantity <= p.lowStockAlert && p.quantity > 0);
    const outOfStockProducts = products.filter(p => p.quantity === 0);
    const totalValue = products.reduce((sum, p) => sum + (p.quantity * p.purchasePrice), 0);
    const totalSaleValue = products.reduce((sum, p) => sum + (p.quantity * p.salePrice), 0);

    return {
      totalProducts,
      lowStockProducts: lowStockProducts.length,
      outOfStockProducts: outOfStockProducts.length,
      totalValue,
      totalSaleValue,
      profitMargin: totalValue > 0 ? ((totalSaleValue - totalValue) / totalValue * 100) : 0,
    };
  };

  const getStockStatusBadge = (product: Product) => {
    if (product.quantity === 0) {
      return <Badge className="bg-red-100 text-red-800">نفد المخزون</Badge>;
    } else if (product.quantity <= product.lowStockAlert) {
      return <Badge className="bg-yellow-100 text-yellow-800">مخزون منخفض</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800">متوفر</Badge>;
    }
  };

  const stats = getInventoryStats();

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
                <p className="text-sm text-slate-600">إجمالي المنتجات</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalProducts}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">قيمة المخزون</p>
                <p className="text-2xl font-bold text-slate-900">₪{stats.totalValue.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">مخزون منخفض</p>
                <p className="text-2xl font-bold text-slate-900">{stats.lowStockProducts}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">نفد المخزون</p>
                <p className="text-2xl font-bold text-slate-900">{stats.outOfStockProducts}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600" />
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
              placeholder="البحث في المنتجات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="تصفية حسب الفئة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الفئات</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة منتج جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
              </DialogTitle>
              <DialogDescription>
                {editingProduct 
                  ? 'قم بتعديل بيانات المنتج'
                  : 'أدخل بيانات المنتج الجديد'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">اسم المنتج *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="sku">رمز المنتج (SKU) *</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({...formData, sku: e.target.value})}
                    required
                    placeholder="مثال: PROD001"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">الفئة *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({...formData, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الفئة" />
                    </SelectTrigger>
                    <SelectContent>
                      {commonCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="unit">الوحدة *</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => setFormData({...formData, unit: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الوحدة" />
                    </SelectTrigger>
                    <SelectContent>
                      {commonUnits.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">الكمية الحالية</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="lowStockAlert">تنبيه المخزون المنخفض</Label>
                  <Input
                    id="lowStockAlert"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.lowStockAlert}
                    onChange={(e) => setFormData({...formData, lowStockAlert: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="purchasePrice">سعر الشراء</Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({...formData, purchasePrice: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="salePrice">سعر البيع</Label>
                  <Input
                    id="salePrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.salePrice}
                    onChange={(e) => setFormData({...formData, salePrice: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">الوصف</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  إلغاء
                </Button>
                <Button type="submit">
                  {editingProduct ? 'تحديث' : 'إضافة'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Products List */}
      <Card>
        <CardHeader>
          <CardTitle>المنتجات</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">الكل ({stats.totalProducts})</TabsTrigger>
              <TabsTrigger value="low-stock">مخزون منخفض ({stats.lowStockProducts})</TabsTrigger>
              <TabsTrigger value="out-of-stock">نفد المخزون ({stats.outOfStockProducts})</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-6">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Package className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    لا توجد منتجات
                  </h3>
                  <p className="mb-4">
                    {searchTerm || selectedCategory ? 'لم يتم العثور على نتائج للبحث' : 'لم يتم إضافة أي منتجات بعد'}
                  </p>
                  {!searchTerm && !selectedCategory && (
                    <Button onClick={() => setIsDialogOpen(true)}>
                      <Plus className="w-4 h-4 ml-2" />
                      إضافة منتج جديد
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>اسم المنتج</TableHead>
                        <TableHead>رمز المنتج</TableHead>
                        <TableHead>الفئة</TableHead>
                        <TableHead>الوحدة</TableHead>
                        <TableHead>الكمية</TableHead>
                        <TableHead>سعر الشراء</TableHead>
                        <TableHead>سعر البيع</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => (
                        <TableRow key={product._id?.toString()}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{product.name}</div>
                              {product.description && (
                                <div className="text-sm text-slate-500 truncate max-w-xs">
                                  {product.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">{product.sku}</TableCell>
                          <TableCell>{product.category}</TableCell>
                          <TableCell>{product.unit}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <span className={`font-medium ${
                                product.quantity === 0 ? 'text-red-600' :
                                product.quantity <= product.lowStockAlert ? 'text-yellow-600' :
                                'text-green-600'
                              }`}>
                                {product.quantity}
                              </span>
                              {product.quantity <= product.lowStockAlert && product.quantity > 0 && (
                                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>₪{product.purchasePrice.toLocaleString()}</TableCell>
                          <TableCell>₪{product.salePrice.toLocaleString()}</TableCell>
                          <TableCell>{getStockStatusBadge(product)}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2 space-x-reverse">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(product)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(product._id!.toString())}
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
    </div>
  );
}