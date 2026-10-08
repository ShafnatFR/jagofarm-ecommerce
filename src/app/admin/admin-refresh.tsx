"use client"

import { createContext, useCallback, useContext, useState } from "react"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"

type AdminCacheScope = Window & {
  __jagoAdminClearCache?: (endpointPrefixes?: string[]) => void
}

type AdminRefreshContextValue = {
  refresh: (endpointPrefixes: string[], reload: () => Promise<void> | void) => Promise<void>
}

const AdminRefreshContext = createContext<AdminRefreshContextValue | null>(null)

export function clearAdminCache(endpointPrefixes: string[]) {
  if (typeof window === "undefined") return
  const scope = window as AdminCacheScope
  scope.__jagoAdminClearCache?.(endpointPrefixes)
}

export function AdminRefreshProvider({ children }: { children: React.ReactNode }) {
  const refresh = useCallback(async (endpointPrefixes: string[], reload: () => Promise<void> | void) => {
    clearAdminCache(endpointPrefixes)
    await reload()
  }, [])

  return <AdminRefreshContext.Provider value={{ refresh }}>{children}</AdminRefreshContext.Provider>
}

export function useAdminRefresh() {
  const context = useContext(AdminRefreshContext)
  if (!context) throw new Error("useAdminRefresh must be used inside AdminRefreshProvider")
  return context
}

export function AdminRefreshButton({
  endpointPrefixes,
  onRefresh,
  loading = false,
}: {
  endpointPrefixes: string[]
  onRefresh: () => Promise<void> | void
  loading?: boolean
}) {
  const { refresh } = useAdminRefresh()
  const [refreshing, setRefreshing] = useState(false)
  const disabled = loading || refreshing

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      disabled={disabled}
      onClick={async () => {
        setRefreshing(true)
        try {
          await refresh(endpointPrefixes, onRefresh)
        } finally {
          setRefreshing(false)
        }
      }}
      title="Refresh data"
    >
      <Icon name="refresh" size={16} className={disabled ? "mr-2 animate-spin" : "mr-2"} />
      {disabled ? "Memuat..." : "Refresh"}
    </Button>
  )
}
