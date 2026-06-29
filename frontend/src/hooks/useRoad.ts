import { useEffect, useState } from 'react'
import { getRoad } from '@/utils/api'
import type { Road, WorkOrder } from '@/types'

interface RoadState {
  loading: boolean
  road: Road | null
  workOrders: WorkOrder[]
  notFound: boolean
  error: string | null
}

export function useRoad(slug: string): RoadState {
  const [state, setState] = useState<RoadState>({
    loading: true,
    road: null,
    workOrders: [],
    notFound: false,
    error: null,
  })

  useEffect(() => {
    let cancelled = false

    getRoad(slug)
      .then((result) => {
        if (cancelled) return
        if (!result) {
          setState({ loading: false, road: null, workOrders: [], notFound: true, error: null })
        } else {
          setState({ loading: false, road: result.road, workOrders: result.work_orders, notFound: false, error: null })
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setState({ loading: false, road: null, workOrders: [], notFound: false, error: err instanceof Error ? err.message : 'Failed to load road' })
      })

    return () => {
      cancelled = true
    }
  }, [slug])

  return state
}
