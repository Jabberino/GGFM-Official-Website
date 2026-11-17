"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChevronRight } from "lucide-react"
import AudioPlayer from "@/components/dj-hunt/audio-player"
import { FinalistVotingForm } from "@/components/dj-hunt/voting-form"
import { useFinalistSection } from "@/hooks/polls/dj-hunt/use-finalist-section"

export function FinalistsSection() {
  const {
    Finalists,
    loading,
    error,
    selectedFinalist, setSelectedFinalist,
    isVotingOpen, setIsVotingOpen,
    isWithinVotingWindow,
    buildDriveEmbedSrc
  } = useFinalistSection()

  return (
    <section id="finalists" className="relative overflow-hidden bg-[#569429]">
      {/* Original diagonal stripes */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: 0.06,
          backgroundImage:
            "repeating-linear-gradient(45deg, #191919 0, #191919 2px, transparent 2px, transparent 14px)",
        }}
      />

      {/* 90s "Memphis" squiggles, triangles, dots and crosses */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ opacity: 0.1 }}
      >
        <defs>
          <pattern id="finalists-memphis" width="180" height="180" patternUnits="userSpaceOnUse">
            <path
              d="M14 32 q10 -14 20 0 t20 0 t20 0"
              fill="none"
              stroke="#191919"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <polygon points="124,24 144,60 104,60" fill="none" stroke="#ffffff" strokeWidth="3" />
            <circle cx="44" cy="124" r="7" fill="#191919" />
            <circle cx="68" cy="142" r="3" fill="#ffffff" />
            <path d="M118 118 l24 24 M142 118 l-24 24" stroke="#191919" strokeWidth="4" strokeLinecap="round" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#finalists-memphis)" />
      </svg>

      {/* Outer container handles the exact, even padding for top and bottom */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto min-h-100 relative flex flex-col items-center justify-center px-6 py-12"
      >
        <div className="container relative z-10 mx-auto">
          {/* Opening-credits style heading */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-10 text-center"
          >
            <p className="font-secondary text-xs font-extrabold uppercase tracking-[0.35em] text-[#191919] sm:text-sm">
              Starring
            </p>
            <h2
              className="mt-1 -rotate-1 font-kenyan text-4xl font-bold uppercase tracking-tight text-white sm:text-5xl"
              style={{ textShadow: "3px 3px 0 #191919" }}
            >
              The Finalists
            </h2>
          </motion.div>

          {loading && (
            <p className="mb-4 text-center font-secondary font-medium text-[#191919]">Loading…</p>
          )}
          {error && (
            <p className="mb-4 text-center font-secondary font-bold text-[#e50101]">{error}</p>
          )}
          {!loading && !error && Finalists.length === 0 && (
            <p className="mb-4 text-center font-secondary font-medium text-[#191919]">No finalists found.</p>
          )}

          {/* 4-Column Grid Layout (Internal vertical padding removed to prevent top space distortion) */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="grid w-full grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 justify-items-center"
          >
            {Finalists.map((Finalist, index) => (
              <motion.div
                key={Finalist.id}
                className="relative flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border-4 border-white bg-[#191919] text-white shadow-[6px_6px_0_#191919] transition-shadow duration-300 hover:shadow-[10px_10px_0_#191919]"
                initial={{ y: 50, opacity: 0, rotate: 0 }}
                animate={{ y: 0, opacity: 1, rotate: index % 2 === 0 ? -1.5 : 1.5 }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.6 }}
                whileHover={{ scale: 1.03, rotate: 0, y: -8 }}
                whileTap={{ scale: 0.97 }}
              >
                <motion.img
                  src={Finalist.image}
                  alt={Finalist.name}
                  className="h-auto w-full object-contain"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                />
                <div className="flex h-full flex-col border-t-4 border-[#569429] p-6">
                  <motion.h3
                    className="font-kenyan text-3xl font-bold uppercase tracking-tight"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                  >
                    {Finalist.name}
                  </motion.h3>
                  <motion.p
                    className="mt-2 font-secondary text-sm text-[#a8a8a8]"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1 + index * 0.1, duration: 0.5 }}
                  >
                    {Finalist.description}
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 + index * 0.1, duration: 0.5 }}
                    className="mt-auto flex justify-center pt-6"
                  >
                    <Button
                      size="lg"
                      className="group w-full bg-[#569429] font-secondary font-bold uppercase tracking-wide text-black hover:scale-105 hover:bg-[#63a92f] hover:shadow-[0_0_25px_-5px_#569429]"
                      onClick={() => setSelectedFinalist(Finalist)}
                    >
                      View Details
                      <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Cleaned layout block separating the grid from the action elements below it */}
        <div className="relative z-10 mt-10 flex flex-col items-center gap-3">
          {isWithinVotingWindow ? (
            <>
              <Button
                size="xl"
                className="rounded-full border-4 border-white bg-[#191919] px-10 py-5 font-secondary text-2xl font-extrabold uppercase tracking-widest text-white shadow-[5px_5px_0_#ffffff] transition-all duration-300 hover:scale-105 hover:bg-white hover:text-[#191919] hover:shadow-[5px_5px_0_#191919]"
                onClick={() => setIsVotingOpen(true)}
              >
                Vote
              </Button>
              {/* Studio "applause" sign */}
              <motion.span
                className="flex items-center gap-2 font-secondary text-xs font-extrabold uppercase tracking-[0.3em] text-[#191919]"
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              >
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#e50101]" />
                Applause
              </motion.span>
            </>
          ) : (
            <>
              <Button
                size="xl"
                disabled
                className="cursor-not-allowed rounded-full bg-[#191919]/40 px-10 py-5 font-secondary text-2xl font-extrabold uppercase tracking-widest text-white/50"
              >
                Voting Closed
              </Button>
              <span className="font-secondary text-xs font-extrabold uppercase tracking-[0.3em] text-[#191919]/70">
                Off Air · Thanks for Watching
              </span>
            </>
          )}
        </div>
      </motion.div>

      {/* Details Modal */}
      <Dialog open={!!selectedFinalist} onOpenChange={() => setSelectedFinalist(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-scroll border-2 border-[#569429] bg-[#191919] p-6 text-white scrollbar-hide sm:max-w-270">
          <DialogHeader>
            <DialogTitle
              className="flex justify-start font-kenyan text-2xl uppercase tracking-tight text-white"
              style={{ textShadow: "2px 2px 0 #569429" }}
            >
              {selectedFinalist?.name}
            </DialogTitle>

            {selectedFinalist && (
              <>
                <div className="mb-6 flex flex-col items-center">
                  <h1 className="m-0 mb-2 font-secondary text-xs font-semibold uppercase tracking-[0.2em] text-[#569429]">
                    Stinger
                  </h1>
                  <AudioPlayer src={selectedFinalist.stinger} />
                </div>

                <div className="mt-2 grid w-full grid-cols-1 gap-6 md:grid-cols-3">
                  {/* Segue */}
                  <div className="flex flex-col items-center">
                    <h2 className="mb-2 text-center font-secondary text-xs font-semibold uppercase tracking-[0.2em] text-[#569429]">
                      Segue Challenge
                    </h2>
                    <div className="relative aspect-9/16 w-full overflow-hidden rounded-2xl border-4 border-white bg-black shadow-[5px_5px_0_#569429]">
                      <iframe
                        src={buildDriveEmbedSrc(selectedFinalist.segue)}
                        className="absolute left-0 top-0 h-full w-full border-0"
                        allow="autoplay; fullscreen"
                        title="Segue Challenge"
                      />
                    </div>
                  </div>

                  {/* Solo Videoshoot */}
                  <div className="flex flex-col items-center">
                    <h2 className="mb-2 text-center font-secondary text-xs font-semibold uppercase tracking-[0.2em] text-[#569429]">
                      Solo Videoshoot
                    </h2>
                    <div className="relative aspect-9/16 w-full overflow-hidden rounded-2xl border-4 border-white bg-black shadow-[5px_5px_0_#569429]">
                      <iframe
                        src={buildDriveEmbedSrc(selectedFinalist.videoshoot)}
                        className="absolute left-0 top-0 h-full w-full border-0"
                        allow="autoplay; fullscreen"
                        title="Solo Videoshoot"
                      />
                    </div>
                  </div>

                  {/* Voiceover Challenge */}
                  <div className="flex flex-col items-center">
                    <h2 className="mb-2 text-center font-secondary text-xs font-semibold uppercase tracking-[0.2em] text-[#569429]">
                      Voiceover Challenge
                    </h2>
                    <div className="relative aspect-9/16 w-full overflow-hidden rounded-2xl border-4 border-white bg-black shadow-[5px_5px_0_#569429]">
                      <iframe
                        src={buildDriveEmbedSrc(selectedFinalist.voiceover)}
                        className="absolute left-0 top-0 h-full w-full border-0"
                        allow="autoplay; fullscreen"
                        title="Voiceover Challenge"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Voting Form Modal */}
      <Dialog open={isVotingOpen} onOpenChange={setIsVotingOpen}>
        <DialogContent className="max-w-200 border-2 border-[#569429] bg-[#191919] p-6 text-white">
          <DialogHeader>
            <DialogTitle
              className="text-center font-kenyan text-2xl uppercase tracking-tight text-white"
              style={{ textShadow: "2px 2px 0 #569429" }}
            >
              Vote for Your Favorite DJ Finalists (Max. 3)
            </DialogTitle>
          </DialogHeader>
          <FinalistVotingForm Finalists={Finalists} />
        </DialogContent>
      </Dialog>
    </section>
  )
}