import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function proxy() {},
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname

        if (pathname.startsWith('/admin')) {
          return token?.role === 'admin'
        }

        if (pathname.startsWith('/cashier')) {
          return token?.role === 'cashier' || token?.role === 'admin'
        }

        if (pathname.startsWith('/waitress')) {
          return token?.role === 'waitress' || token?.role === 'admin'
        }

        return !!token
      },
    },
  }
)

export const config = {
  matcher: ['/admin/:path*', '/cashier/:path*', '/waitress/:path*'],
}
