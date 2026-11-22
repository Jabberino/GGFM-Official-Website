"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { getVotesAction, submitVotesAction } from "@/actions/dj-hunt"
import { loginAction, logoutAction } from "@/actions/auth"
import { MAX_VOTES_PER_USER } from "@/constants/dj-hunt"
import { decodeJwtPayload } from "@/lib/utils"
import { AuthUser } from "@/types/dj-hunt"

const SESSION_ERROR = "Invalid or expired session"

export function useFinalistVoting() {
  const [user, setUserState] = useState<AuthUser | null>(null)

  const [selected, setSelected] = useState<number[]>([])
  const [savedVotes, setSavedVotes] = useState<number[]>([])

  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)

  // Wrap setUser so signing out (setUser(null)) also clears the server cookie
  const setUser = useCallback((next: AuthUser | null) => {
    setUserState(next)
    if (next === null) void logoutAction()
  }, [])

  const resetSession = useCallback((msg = "") => {
    setUser(null)
    setSelected([])
    setSavedVotes([])
    setMessage(msg)
  }, [setUser])

  // --- 1. GOOGLE SIGN-IN HANDLER: verify on the server and set the session cookie ---
  const handleToken = useCallback(async (credential: string) => {
    const payload = decodeJwtPayload(credential)
    if (!payload?.email) {
      setMessage("Failed to read Google token.")
      return
    }

    setMessage("")
    const result = await loginAction(credential)
    if (!result.success || !result.email) {
      setMessage(result.error || "Sign-in failed. Please try again.")
      return
    }

    setUserState({ email: result.email, token: credential })
  }, [])

  // --- 2. FETCH EXISTING VOTES ---
  useEffect(() => {
    async function fetchVotes() {
      if (!user?.token) return

      setFetching(true)
      try {
        const result = await getVotesAction()

        if (result.success && result.votedIds) {
          setSelected(result.votedIds)
          setSavedVotes(result.votedIds)
        } else if (result.error === SESSION_ERROR) {
          resetSession("Your session expired. Please sign in again.")
        } else {
          setMessage(result.error || "Could not load votes")
        }
      } catch {
        setMessage("Could not load votes")
      } finally {
        setFetching(false)
      }
    }

    fetchVotes()
  }, [user, resetSession])

  // --- 3. SELECTION HELPERS ---
  const toggle = useCallback((id: number) => {
    setMessage("")
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)

      if (prev.length >= MAX_VOTES_PER_USER) {
        setMessage(`You can only select up to ${MAX_VOTES_PER_USER} Finalists.`)
        return prev
      }

      return [...prev, id]
    })
  }, [])

  const isSelected = useCallback((id: number) => selected.includes(id), [selected])

  const hasChanges = useMemo(
    () => JSON.stringify([...selected].sort()) !== JSON.stringify([...savedVotes].sort()),
    [selected, savedVotes]
  )

  // --- 4. SUBMISSION LOGIC ---
  const submit = useCallback(async () => {
    setMessage("")
    if (!user) return setMessage("Please sign in first.")
    if (selected.length === 0) return setMessage("Select at least one Finalist.")

    setLoading(true)
    try {
      const result = await submitVotesAction(selected)

      if (!result.success) {
        if (result.error === SESSION_ERROR) {
          resetSession("Your session expired. Please sign in again.")
          return
        }
        throw new Error(result.error)
      }

      setSavedVotes(selected)
      setMessage(result.message || "Votes updated successfully!")
    } catch (e: any) {
      setMessage(e.message || "Failed to submit votes.")
    } finally {
      setLoading(false)
    }
  }, [user, selected, resetSession])

  return {
    user, setUser,
    selected, setSelected,
    savedVotes, setSavedVotes,
    message,
    loading,
    fetching,
    toggle,
    isSelected,
    hasChanges,
    submit,
    handleToken
  }
}