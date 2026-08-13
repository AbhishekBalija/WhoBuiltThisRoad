import { SearchBar } from '@/components/SearchBar'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 overflow-x-hidden bg-gray-50 px-4">
      <div className="w-full max-w-xl text-center">
        <h1 className="text-2xl font-bold text-emerald-600 sm:text-4xl">Who Built This Road</h1>
        <p className="mt-3 text-sm text-gray-600 sm:text-base">
          Search any road in Bengaluru to see who built it, how much public money was spent,
          and whether the warranty is still active.
        </p>
        <p className="mt-1 text-xs text-gray-400">All information sourced from government records.</p>
      </div>
      <SearchBar />
    </main>
  )
}
