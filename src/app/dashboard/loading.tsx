import { SkeletonCard, Skeleton } from '@/components/ui/Skeleton'

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div>
        <Skeleton style={{ height: '28px', width: '200px', marginBottom: '8px' }} />
        <Skeleton style={{ height: '12px', width: '140px' }} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
      </div>

      {/* Chart */}
      <div className="p-5" style={{ backgroundColor: '#141210', border: '1px solid #1e1b18' }}>
        <Skeleton style={{ height: '10px', width: '160px', marginBottom: '16px' }} />
        <Skeleton style={{ height: '120px', width: '100%' }} />
      </div>

      {/* Recent runs */}
      <div className="p-5" style={{ backgroundColor: '#141210', border: '1px solid #1e1b18' }}>
        <Skeleton style={{ height: '10px', width: '100px', marginBottom: '16px' }} />
        <div className="space-y-px">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <div className="flex-1 space-y-1.5">
                <Skeleton style={{ height: '12px', width: '60%' }} />
                <Skeleton style={{ height: '10px', width: '35%' }} />
              </div>
              <Skeleton style={{ height: '12px', width: '45px' }} />
              <Skeleton style={{ height: '12px', width: '45px' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
