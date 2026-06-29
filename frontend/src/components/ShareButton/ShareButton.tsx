import { useState } from 'react'
import type { Road, WorkOrder, DLPStatus } from '@/types'

const STATUS_TEXT: Record<DLPStatus, string> = {
  active: 'warranty still active',
  expiring_soon: 'warranty expiring soon',
  expired: 'warranty already expired',
  unknown: '',
}

export interface ShareButtonProps {
  road: Pick<Road, 'slug' | 'name' | 'ward_name'>
  latestWorkOrder?: Pick<WorkOrder, 'contractor_name' | 'dlp_status'> | null
}

export function ShareButton({ road, latestWorkOrder }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const url = `${window.location.origin}/road/${road.slug}`
  const contractor = latestWorkOrder?.contractor_name || 'unknown contractor'
  const dlpStatus = latestWorkOrder?.dlp_status || 'unknown'
  const statusText = STATUS_TEXT[dlpStatus]

  const shareText = `${road.name} (${road.ward_name}) was built by ${contractor}. ${statusText}. Public record:`.replace(/\s+/g, ' ').trim()

  function shareWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + url)}`, '_blank')
  }

  function shareX() {
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`, '_blank')
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // clipboard unavailable — show feedback anyway
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mt-4 border-t pt-4">
      <p className="mb-2 text-xs font-medium text-gray-500">Share this road's public record</p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={shareWhatsApp}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
        >
          Share on WhatsApp
        </button>
        <button
          onClick={shareX}
          className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800"
        >
          Share on X
        </button>
        <button
          onClick={copyLink}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
      </div>
    </div>
  )
}
