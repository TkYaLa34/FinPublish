"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Mail, Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      // Set access token cookie for Next.js Middleware authentication checks (works for real & mock clients!)
      const token = data?.session?.access_token || 'mock-access-token';
      document.cookie = `sb-access-token=${token}; path=/; max-age=3600`;

      setMessage({ type: 'success', text: 'เข้าสู่ระบบสำเร็จ! กำลังนำคุณไปยัง CMS Dashboard...' });
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1500);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12">
      <Card className="w-full max-w-md shadow-lg border border-slate-200">
        <CardHeader className="text-center space-y-1 pb-4">
          <CardTitle className="text-2xl font-extrabold text-slate-900">ยินดีต้อนรับกลับมา</CardTitle>
          <p className="text-sm text-slate-500">ลงชื่อเข้าใช้งานระบบจัดการบทความการเงิน</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">อีเมลผู้ใช้งาน</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="w-5 h-5 text-slate-400" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-md outline-none focus:border-blue-500 transition-colors text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">รหัสผ่าน</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="w-5 h-5 text-slate-400" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-md outline-none focus:border-blue-500 transition-colors text-sm"
                />
              </div>
            </div>

            {message && (
              <div
                className={`p-3 rounded-md flex items-start space-x-2 text-sm ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <div className="pt-2">
              <Button type="submit" disabled={loading} className="w-full flex justify-center py-2.5 font-bold">
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : 'ลงชื่อเข้าใช้งาน'}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3 text-center justify-center pb-6 bg-slate-50 border-t border-slate-100 rounded-b-lg">
          <p className="text-xs text-slate-500 mt-2">
            ยังไม่มีบัญชีผู้เขียน?{' '}
            <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center">
              สมัครสมาชิกใหม่ <ArrowRight className="w-3 h-3 ml-0.5" />
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
