import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { canAccessAdmin, mapStaffRole } from '@/lib/permissions'

export default withAuth(
  function proxy(req) {
    const pathname = req.nextUrl.pathname

    if (pathname.startsWith('/cashier') || pathname.startsWith('/waitress')) {
      return NextResponse.redirect(new URL('/staff', req.url))
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname

        if (pathname.startsWith('/admin')) {
          if (!token?.role) return false
          return canAccessAdmin({
            role: token.role,
            staffRole: mapStaffRole(token.staffRole as string | null | undefined),
          })
        }

        if (pathname.startsWith('/staff')) {
          return token?.role === 'admin' || token?.role === 'staff'
        }

        if (pathname.startsWith('/cashier') || pathname.startsWith('/waitress')) {
          return token?.role === 'admin' || token?.role === 'staff'
        }

        return !!token
      },
    },
  }
)

export const config = {
  matcher: ['/admin/:path*', '/staff/:path*', '/cashier/:path*', '/waitress/:path*'],
}
