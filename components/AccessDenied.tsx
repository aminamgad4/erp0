'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, ArrowRight, Home } from 'lucide-react';

interface AccessDeniedProps {
  title?: string;
  message?: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
}

export default function AccessDenied({ 
  title = 'غير مصرح بالوصول',
  message = 'ليس لديك صلاحية للوصول إلى هذه الصفحة',
  showBackButton = true,
  showHomeButton = true
}: AccessDeniedProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-red-100 text-red-600 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            {title}
          </CardTitle>
          <CardDescription className="text-slate-600">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {showBackButton && (
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                <ArrowRight className="w-4 h-4 ml-2 rotate-180" />
                العودة
              </Button>
            )}
            {showHomeButton && (
              <Button
                onClick={() => router.push('/dashboard')}
                className="flex-1"
              >
                <Home className="w-4 h-4 ml-2" />
                الرئيسية
              </Button>
            )}
          </div>
          
          <div className="text-center text-sm text-slate-500 mt-6">
            <p>إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع المدير</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}