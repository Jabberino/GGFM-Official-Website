"use client"

import { memo } from "react"
import { Finalist } from "@/types/dj-hunt"
import { useFinalistVoting } from "@/hooks/polls/dj-hunt/use-finalist-voting"
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google"

function FinalistVotingFormComponent({ Finalists }: { Finalists: Finalist[] }) {
  const {
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
  } = useFinalistVoting()

  const isSaved = !hasChanges && savedVotes.length > 0

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
      {/* Auth State: Not Signed In */}
      {!user && (
        <div className="mx-auto mb-4 flex w-full max-w-md flex-col items-center justify-center">
          <div className="w-full -rotate-1 rounded-lg border-4 border-white bg-[#191919] p-6 text-center shadow-[5px_5px_0_#569429]">
            <p className="font-secondary text-xs font-extrabold uppercase tracking-[0.3em] text-[#569429]">
              ★ Audience Check-In ★
            </p>
            <p className="mt-2 font-kenyan text-2xl font-bold uppercase tracking-tight text-white">
              Grab Your Ticket
            </p>
            <div className="mt-5 flex min-h-11 justify-center">
              <GoogleLogin
                onSuccess={(credentialResponse) => {
                  if (credentialResponse.credential && handleToken) {
                    handleToken(credentialResponse.credential)
                  }
                }}
                onError={() => console.error('Login Failed')}
                theme="outline"
                shape="pill"
              />
            </div>
            <p className="mt-4 font-secondary text-xs uppercase tracking-[0.2em] text-[#a8a8a8]">
              Sign in with Google to vote
            </p>
          </div>
        </div>
      )}

      {/* Auth State: Signed In */}
      {user && (
        <div className="scrollbar-hide mx-auto max-h-[80vh] w-full max-w-3xl overflow-y-scroll px-2 pb-3 pt-2">
          {/* Lower-third style "voting as" bar */}
          <div className="mb-6 flex w-full flex-col items-stretch overflow-hidden rounded-lg border-4 border-white bg-[#191919] shadow-[4px_4px_0_#569429] sm:flex-row">
            <span className="flex items-center justify-center gap-2 border-b-4 border-white bg-[#569429] px-4 py-1.5 font-secondary text-xs font-extrabold uppercase tracking-widest text-[#191919] sm:border-b-0 sm:border-r-4">
              <span aria-hidden="true" className="h-2 w-2 animate-pulse rounded-full bg-[#e50101]" />
              Voting As
            </span>
            <div className="flex flex-1 flex-wrap items-center justify-center gap-x-3 px-4 py-2 sm:justify-between">
              <strong className="break-all font-secondary text-sm font-semibold text-white">
                {user.email}
              </strong>
              <button
                onClick={() => {
                  setUser(null)
                  setSelected([])
                  setSavedVotes([])
                }}
                className="font-secondary text-xs font-bold uppercase tracking-widest text-[#a8a8a8] underline-offset-4 transition-colors hover:text-[#e50101] hover:underline"
              >
                Sign Out
              </button>
            </div>
          </div>

          {fetching ? (
            <div className="py-20 text-center font-secondary text-sm font-extrabold uppercase tracking-[0.3em] text-[#569429]">
              <span className="animate-pulse">Please Stand By…</span>
            </div>
          ) : (
            <>
              {/* Pick counter */}
              <div className="mb-4 flex items-center justify-between font-secondary text-xs font-extrabold uppercase tracking-[0.25em]">
                <span className="text-[#569429]">Pick Your Favorites</span>
                <span className={selected.length >= 3 ? "text-[#e50101]" : "text-[#a8a8a8]"}>
                  {selected.length} / 3
                </span>
              </div>

              {message && (
                <p
                  role="status"
                  className="mb-4 rounded-md border-2 border-[#e50101] px-3 py-2 text-center font-secondary text-xs font-extrabold uppercase tracking-[0.2em] text-[#e50101]"
                >
                  {message}
                </p>
              )}

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {Finalists.map((Finalist, index) => {
                  const selectedState = isSelected(Finalist.id)
                  return (
                    <button
                      key={Finalist.id}
                      type="button"
                      onClick={() => toggle(Finalist.id)}
                      aria-pressed={selectedState}
                      className={[
                        "group relative flex h-40 w-full items-stretch overflow-hidden rounded-xl border-4 bg-[#191919] text-left transition-all duration-200",
                        index % 2 === 0 ? "sm:-rotate-1" : "sm:rotate-1",
                        "hover:rotate-0 hover:-translate-y-1",
                        selectedState
                          ? "border-[#569429] shadow-[5px_5px_0_#569429]"
                          : "border-white shadow-[5px_5px_0_#569429]/0 hover:shadow-[5px_5px_0_#569429]",
                      ].join(" ")}
                    >
                      {/* Selected: green wash */}
                      {selectedState && (
                        <div
                          aria-hidden
                          className="pointer-events-none absolute inset-0 z-10 bg-[#569429]/10"
                        />
                      )}

                      <div className="relative w-32 flex-none border-r-4 border-[#569429]">
                        <img
                          src={Finalist.image}
                          alt={Finalist.name}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      </div>

                      <div className="flex grow flex-col justify-center px-4 py-3">
                        <p className="font-secondary text-[10px] font-extrabold uppercase tracking-[0.3em] text-[#569429]">
                          Finalist
                        </p>
                        <p className="truncate font-kenyan text-2xl font-bold uppercase tracking-tight text-white">
                          {Finalist.name}
                        </p>
                      </div>

                      {/* Star check */}
                      <div className="flex items-center pr-4">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-base font-bold transition-all duration-200 ${
                            selectedState
                              ? "scale-110 border-white bg-[#569429] text-[#191919]"
                              : "border-[#a8a8a8]/50 text-transparent group-hover:border-[#569429]"
                          }`}
                        >
                          ★
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              <button
                onClick={submit}
                disabled={loading || !hasChanges || selected.length === 0}
                className={[
                  "mt-7 w-full rounded-full border-4 py-3 font-secondary text-lg font-extrabold uppercase tracking-widest transition-all duration-300",
                  isSaved
                    ? "cursor-default border-[#a8a8a8] bg-[#a8a8a8] text-[#191919]"
                    : "border-white bg-[#569429] text-[#191919] shadow-[5px_5px_0_#ffffff] hover:scale-[1.02] hover:bg-[#63a92f]",
                  "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100",
                ].join(" ")}
              >
                {loading
                  ? "Saving…"
                  : isSaved
                  ? "★ Votes Saved ★"
                  : selected.length > 0
                  ? `Submit ${selected.length} Vote${selected.length !== 1 ? "s" : ""}`
                  : "Select a Finalist"}
              </button>

            </>
          )}
        </div>
      )}
    </GoogleOAuthProvider>
  )
}

export const FinalistVotingForm = memo(FinalistVotingFormComponent)