import { SkeletonCard, Skeleton } from '@/components/ui/Skeleton'

export default function TrainingLoading() {
  return (
    <div>
      <div className="mb-8">
        <Skeleton style={{ height: '28px', width: '160px', marginBottom: '6px' }} />
        <Skeleton style={{ height: '12px', width: '200px' }} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
      </div>

      {/* Workout calendar */}
      <div className="p-5" style={{ backgroundColor: '#141210', border: '1px solid #1e1b18' }}>
        <Skeleton style={{ height: '10px', width: '100px', marginBottom: '16px' }} />
        <div className="grid grid-cols-7 gap-1">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} style={{ height: '10px', width: '100%' }} />
          ))}
          {[...Array(28)].map((_, i) => (
            <Skeleton key={i + 7} style={{ height: '70px', width: '100%' }} />
          ))}
        </div>
      </div>
    </div>
  )
}
