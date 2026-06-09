import { CustomerLayoutShell } from '@/components/customer/customer-layout-shell'

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return <CustomerLayoutShell>{children}</CustomerLayoutShell>
}
