"use client"

import * as React from "react"

import type { ToastActionElement, ToastProps } from "@/components/ui/toast"

const TOAST_LIMIT = 1
/**
 * Durasi tampil toast sebelum tertutup sendiri. Sebelumnya file ini memakai
 * TOAST_REMOVE_DELAY = 1000000 (shadcn klasik) — toast mentang hampir 17
 * menit dan tidak pernah mati sendiri, membuat admin berpikir aksi gagal.
 * Sekarang: auto-dismiss 5 dtk; `duration: 0` = sticky.
 */
const TOAST_DEFAULT_DURATION = 5000
// Jeda pendek setelah user menutup manual agar animasi close selesai dulu.
const TOAST_REMOVE_DELAY = 350

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  /**
   * Lamanya toast tampil (ms) sebelum tertutup sendiri.
   * 0 = sticky (hanya bisa ditutup manual). Default 5000.
   */
  duration?: number
}

/** Nilai `type` pada action reducer toast. */
type ActionType = {
  ADD_TOAST: "ADD_TOAST"
  UPDATE_TOAST: "UPDATE_TOAST"
  DISMISS_TOAST: "DISMISS_TOAST"
  REMOVE_TOAST: "REMOVE_TOAST"
}

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

/**
 * Jadwalkan penghapusan toast dari state.
 * Selalu REPLACE timer lama (bukan skip bila sudah ada) — penting agar
 * close manual lebih cepat dari auto-dismiss yang sudah terjadwal.
 */
function scheduleRemove(toastId: string, delay: number) {
  const existing = toastTimeouts.get(toastId)
  if (existing) clearTimeout(existing)
  toastTimeouts.set(
    toastId,
    setTimeout(() => {
      toastTimeouts.delete(toastId)
      dispatch({
        type: "REMOVE_TOAST",
        toastId: toastId,
      })
    }, delay)
  )
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      if (toastId) {
        scheduleRemove(toastId, TOAST_REMOVE_DELAY)
      } else {
        state.toasts.forEach((toast) => {
          scheduleRemove(toast.id, TOAST_REMOVE_DELAY)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

function toast({ ...props }: Toast) {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  // Auto-dismiss sebesar durasi toast (default 5 dtk). duration: 0 = sticky.
  const duration = props.duration ?? TOAST_DEFAULT_DURATION
  if (duration > 0) scheduleRemove(id, duration)

  return {
    id: id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }
