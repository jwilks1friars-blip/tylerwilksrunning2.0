import { SkeletonCard, SkeletonRow, Skeleton } from '@/components/ui/Skeleton'

export default function RunsLoading() {
  return (
    <div>
      <div className="mb-8">
        <Skeleton style={{ height: '28px', width: '80px', marginBottom: '6px' }} />
        <Skeleton style={{ height: '12px', width: '140px' }} />
      </div>

      {/* PRs */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
      </div>

      {/* Chart */}
      <div className="p-5 mb-6" style={{ backgroundColor: '#141210', border: '1px solid #1e1b18' }}>
        <Skeleton style={{ height: '10px', width: '180px', marginBottom: '16px' }} />
        <Skeleton style={{ height: '100px', width: '100%' }} />
      </div>

      {/* Activity list header */}
      <div className="flex gap-4 px-4 pb-2 mb-1">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} style={{ height: '10px', flex: i === 0 ? 1 : undefined, width: i === 0 ? undefined : '60px' }} />
        ))}
      </div>
      <div className="space-y-px">
        {[...Array(8)].map((_, i) => <SkeletonRow key={i} />)}
      </div>
    </div>
  )
}
