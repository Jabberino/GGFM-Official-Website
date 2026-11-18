"use client"

import { motion } from "framer-motion"
import EqualDurationTypewriter from "@/components/dj-hunt/equal-duration-typewriter"

export function TitleSection() {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      id="home"
      className="relative flex items-center justify-center overflow-hidden bg-[#191919] px-4 pt-28 pb-12 sm:px-10 lg:px-16"
    >
      {/* 90s "Memphis" backdrop: squiggles, triangles and dots, kept subtle */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ opacity: 0.12 }}
      >
        <defs>
          <pattern id="sitcom-memphis" width="160" height="160" patternUnits="userSpaceOnUse">
            <path
              d="M12 28 q10 -14 20 0 t20 0 t20 0"
              fill="none"
              stroke="#569429"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <polygon points="110,20 130,56 90,56" fill="none" stroke="#a8a8a8" strokeWidth="3" />
            <circle cx="40" cy="110" r="7" fill="#569429" />
            <circle cx="62" cy="126" r="3" fill="#a8a8a8" />
            <path d="M104 104 l24 24 M128 104 l-24 24" stroke="#569429" strokeWidth="4" strokeLinecap="round" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#sitcom-memphis)" />
      </svg>

      <div className="container relative z-10 mx-auto text-center">
        {/* ON AIR light */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 rounded-sm border-2 border-[#e50101] px-4 py-1 font-secondary text-xs font-extrabold uppercase tracking-[0.3em] text-[#e50101] sm:text-sm"
        >
          <motion.span
            aria-hidden="true"
            className="h-2.5 w-2.5 rounded-full bg-[#e50101]"
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
          On Air
        </motion.div>

        {/* Opening-credits title card */}
        <motion.div
          initial={{ scale: 0.6, rotate: -6, opacity: 0 }}
          animate={{ scale: 1, rotate: -2, opacity: 1 }}
          transition={{ type: "spring", stiffness: 160, damping: 11, delay: 0.3 }}
          className="relative mx-auto w-fit"
        >
          <h1 className="font-kenyan text-7xl font-bold uppercase leading-[0.95] tracking-tight text-white md:text-8xl">
            <span style={{ textShadow: "4px 4px 0 #569429" }}>DJ </span>
            <span className="text-[#569429]" style={{ textShadow: "4px 4px 0 #ffffff" }}>
              Hunt
            </span>
          </h1>

          {/* Sparkle accents, like a title-card flourish */}
          <motion.span
            aria-hidden="true"
            className="absolute -right-12 -top-4 text-3xl text-[#569429] md:-right-20 md:text-5xl"
            animate={{ rotate: [0, 20, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 2.4, repeat: Infinity }}
          >
            ✦
          </motion.span>
          <motion.span
            aria-hidden="true"
            className="absolute -left-6 bottom-0 text-2xl text-white md:-left-10 md:text-4xl"
            animate={{ rotate: [0, -20, 0], scale: [1, 1.25, 1] }}
            transition={{ duration: 2.8, repeat: Infinity, delay: 0.6 }}
          >
            ✦
          </motion.span>
        </motion.div>

        {/* Season / episode tag */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="mt-5 font-secondary text-[11px] font-semibold uppercase leading-relaxed tracking-[0.25em] text-[#569429] sm:text-sm sm:tracking-[0.35em]"
        >
          <span className="block sm:inline">Season 2026</span>
          <span aria-hidden="true" className="hidden sm:inline">
            {" · "}
          </span>
          <span className="block sm:inline">The Search for the Next Voice</span>
        </motion.p>

        {/* Lower-third caption bar */}
        <motion.div
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1, rotate: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mx-auto mt-6 flex w-full max-w-md flex-col items-stretch overflow-hidden rounded-lg border-4 border-white bg-[#191919] text-left shadow-[5px_5px_0_#569429] sm:w-fit sm:max-w-full sm:flex-row"
        >
          <span className="flex items-center justify-center gap-2 border-b-4 border-white bg-[#569429] px-4 py-1.5 font-secondary text-xs font-extrabold uppercase tracking-widest text-[#191919] sm:border-b-0 sm:border-r-4 sm:py-0 md:text-sm">
            <span aria-hidden="true">★</span>
            Top of the Hour
          </span>
          <div className="flex min-h-12 items-center justify-center whitespace-nowrap px-3 py-2 text-center font-secondary text-[16px] text-[#a8a8a8] min-[380px]:text-sm sm:min-h-0 sm:justify-start sm:px-4 sm:text-left sm:text-lg md:text-2xl">
            <EqualDurationTypewriter
              lines={[
                "Reaching you from across the airwaves",
                "Shining from the heart of the metro",
                "Serving up the hottest college radio",
              ]}
              typeMs={2000}
              holdMs={1000}
              backspaceMs={1000}
            />
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.5 }}
          className="mt-6 font-secondary text-[10px] font-medium uppercase tracking-[0.3em] text-[#a8a8a8]/70 sm:text-xs"
        >
          Live from Bloemen Hall
        </motion.p>
      </div>
    </motion.section>
  )
}