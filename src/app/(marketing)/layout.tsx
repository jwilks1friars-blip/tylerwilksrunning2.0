import Nav from '@/components/marketing/Nav'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: '#0a0908', color: '#f5f2ee' }}>
      <Nav />
      <div className="pt-16">
        {children}
      </div>
    </div>
  )
}
