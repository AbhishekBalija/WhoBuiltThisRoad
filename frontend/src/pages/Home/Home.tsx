import { SearchBar } from '@/components/SearchBar'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gray-50 px-4">
      <div className="max-w-xl text-center">
        <h1 className="text-4xl font-bold text-emerald-600">Who Built This Road</h1>
        <p className="mt-3 text-gray-600">
          Search any road in Bengaluru to see who built it, how much public money was spent,
          and whether the warranty is still active.
        </p>
        <p className="mt-1 text-xs text-gray-400">All information sourced from government records.</p>
      </div>
      <SearchBar />
    </main>
  )
}
