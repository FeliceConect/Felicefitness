export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] pb-24">
      {/* Header Skeleton */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-start justify-between">
          <div>
            <div className="h-8 w-48 bg-[#1E1E2E] rounded-lg animate-pulse" />
            <div className="h-4 w-36 bg-[#1E1E2E] rounded mt-2 animate-pulse" />
          </div>
          <div className="h-6 w-24 bg-[#1E1E2E] rounded-full animate-pulse" />
        </div>
      </div>

      <main className="px-4 space-y-4">
        {/* Streak e Score */}
        <div className="flex gap-3">
          <div className="flex-1 h-24 bg-[#14141F] border border-[#2E2E3E] rounded-2xl p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#2E2E3E] rounded-full" />
              <div className="space-y-2">
                <div className="h-6 w-16 bg-[#2E2E3E] rounded" />
                <div className="h-3 w-20 bg-[#2E2E3E] rounded" />
              </div>
            </div>
          </div>
          <div className="flex-1 h-24 bg-[#14141F] border border-[#2E2E3E] rounded-2xl p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-[#2E2E3E] rounded-full" />
              <div className="space-y-2">
                <div className="h-4 w-16 bg-[#2E2E3E] rounded" />
                <div className="h-3 w-24 bg-[#2E2E3E] rounded" />
              </div>
            </div>
          </div>
        </div>

        {/* Workout Card */}
        <div className="h-40 bg-[#14141F] border border-[#2E2E3E] rounded-2xl p-5 animate-pulse">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-[#2E2E3E] rounded" />
            <div className="h-4 w-28 bg-[#2E2E3E] rounded" />
          </div>
          <div className="h-6 w-48 bg-[#2E2E3E] rounded mb-2" />
          <div className="h-4 w-32 bg-[#2E2E3E] rounded mb-4" />
          <div className="h-10 w-full bg-[#2E2E3E] rounded-xl" />
        </div>

        {/* Water and Meals Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Water Card */}
          <div className="bg-[#14141F] border border-[#2E2E3E] rounded-2xl p-4 animate-pulse">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-[#2E2E3E] rounded" />
              <div className="h-4 w-12 bg-[#2E2E3E] rounded" />
            </div>
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 bg-[#2E2E3E] rounded-full" />
            </div>
            <div className="flex gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex-1 h-14 bg-[#2E2E3E] rounded-xl" />
              ))}
            </div>
          </div>

          {/* Meals Card */}
          <div className="bg-[#14141F] border border-[#2E2E3E] rounded-2xl p-4 animate-pulse">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-[#2E2E3E] rounded" />
              <div className="h-4 w-20 bg-[#2E2E3E] rounded" />
            </div>
            <div className="space-y-3 mb-4">
              <div className="h-2 w-full bg-[#2E2E3E] rounded" />
              <div className="h-2 w-full bg-[#2E2E3E] rounded" />
            </div>
            <div className="space-y-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-8 w-full bg-[#2E2E3E] rounded" />
              ))}
            </div>
          </div>
        </div>

        {/* Countdown Card */}
        <div className="h-40 bg-[#14141F] border border-[#2E2E3E] rounded-2xl p-5 animate-pulse">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-[#2E2E3E] rounded" />
            <div className="h-4 w-32 bg-[#2E2E3E] rounded" />
          </div>
          <div className="flex justify-center mb-3">
            <div className="h-12 w-24 bg-[#2E2E3E] rounded" />
          </div>
          <div className="flex justify-center">
            <div className="h-4 w-36 bg-[#2E2E3E] rounded" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4 animate-pulse">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 bg-[#2E2E3E] rounded mb-1" />
                <div className="h-5 w-8 bg-[#2E2E3E] rounded mb-1" />
                <div className="h-3 w-12 bg-[#2E2E3E] rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 bg-[#14141F] border border-[#2E2E3E] rounded-xl animate-pulse">
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-6 h-6 bg-[#2E2E3E] rounded mb-1" />
                <div className="h-3 w-10 bg-[#2E2E3E] rounded" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
