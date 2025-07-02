import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value || 
               request.headers.get('authorization')?.replace('Bearer ', '')

  const { pathname } = request.nextUrl

  // 로그인 페이지는 항상 접근 가능
  if (pathname === '/login') {
    return NextResponse.next()
  }

  // 전체 종목 페이지는 로그인 없이도 접근 가능
  if (pathname === '/stocks' || pathname.startsWith('/stocks/')) {
    return NextResponse.next()
  }

  // 토큰이 없으면 로그인 페이지로 리다이렉트
  if (!token) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // 로그인된 사용자가 루트(/)에 접근하면 대시보드로 리다이렉트
  if (pathname === '/' && token) {
    const dashboardUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)',
  ],
} 