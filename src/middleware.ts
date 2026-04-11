import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/authTokens';

export async function middleware(request: NextRequest) {
  // หน้าหรือ API ที่ต้องการให้เช็ค Token เสมอ
  // ตรงนี้สามารถเพิ่ม path ของ API อื่นๆ ที่ต้องการป้องกันได้
  const isProtectedPath = 
    request.nextUrl.pathname.startsWith('/home');
  const isApiProtectedPath = 
    request.nextUrl.pathname.startsWith('/api/flows') || 
    request.nextUrl.pathname.startsWith('/api/simulations') ||
    request.nextUrl.pathname.startsWith('/api/protected');

  if (isProtectedPath || isApiProtectedPath) {
    const token = request.cookies.get('auth_token')?.value;

    // ตรวจสอบความถูกต้องของ Token ด้วยไลบรารี jose ที่ทำงานบน Edge
    const payload = token ? await verifyToken(token) : null;

    if (!payload) {
      // ถ้าไม่มี Token หรือ Token ไม่ถูกต้อง

      // กรณีเป็น API Request ให้ตอบเป็น JSON 401 Unauthorized
      if (request.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json({ message: "Unauthorized: กรุณา Login ใหม่" }, { status: 401 });
      }
      
      // กรณีเป็นการเข้าหน้าเว็บ (เช่น /home) ให้ Redirect กลับไปหน้าแรกเพื่อ Login
      const loginUrl = new URL('/', request.url);
      return NextResponse.redirect(loginUrl);
    }
    
    // หากผ่าน สามารถแนบ x-user-id ไปให้ Backend API ดึงไปใช้ต่อได้สะดวก
    const response = NextResponse.next();
    response.headers.set('x-user-id', payload.user_id as string);
    return response;
  }

  return NextResponse.next();
}

// กำหนดเงื่อนไขว่าให้อนุญาต Middleware ตัวนี้ทำงานกับ Path ไหนบ้าง
// (ช่วยลดภาระเซิร์ฟเวอร์ ไม่ต้องไปเช็คในหน้า public หรือ รูปภาพ)
export const config = {
  matcher: [
    '/home/:path*',
    '/api/flows/:path*',
    '/api/simulations/:path*',
    '/api/protected/:path*'
  ],
};
