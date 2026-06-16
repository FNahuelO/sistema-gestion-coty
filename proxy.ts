import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { isStaffRole } from '@/lib/types'

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
          return token?.role === 'admin'
        }

        if (pathname.startsWith('/staff')) {
          return isStaffRole(token?.role) || token?.role === 'admin'
        }

        if (pathname.startsWith('/cashier') || pathname.startsWith('/waitress')) {
          return isStaffRole(token?.role) || token?.role === 'admin'
        }

        return !!token
      },
    },
  }
)

export const config = {
  matcher: ['/admin/:path*', '/staff/:path*', '/cashier/:path*', '/waitress/:path*'],
}
