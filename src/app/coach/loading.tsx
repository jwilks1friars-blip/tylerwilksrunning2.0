import { Skeleton } from '@/components/ui/Skeleton'

export default function CoachLoading() {
  return (
    <div>
      <div className="mb-8">
        <Skeleton style={{ height: '28px', width: '160px', marginBottom: '6px' }} />
        <Skeleton style={{ height: '12px', width: '200px' }} />
      </div>

      <div className="space-y-px">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-4"
            style={{ borderBottom: '1px solid #1e1b18' }}
          >
            <div className="flex-1 space-y-1.5">
              <Skeleton style={{ height: '12px', width: '40%' }} />
              <Skeleton style={{ height: '10px', width: '25%' }} />
            </div>
            <Skeleton style={{ height: '10px', width: '60px' }} />
            <Skeleton style={{ height: '10px', width: '80px' }} />
          </div>
        ))}
      </div>
    </div>
  )
}
