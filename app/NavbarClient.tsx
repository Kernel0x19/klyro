"use client";

import { motion } from "motion/react";
import { useEffect, useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import Image from "next/image";
import Link from "next/link";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface NavbarClientProps {
  starCount?: number;
  isAuth?: boolean;
  authType?: string;
  isLoggedIn?: boolean;
  avatarUrl?: string | null;
  name?: string;
}

export default function NavbarClient({
  starCount,
  isAuth,
  authType,
  isLoggedIn,
  avatarUrl,
  name,
}: NavbarClientProps) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [canAnimate, setCanAnimate] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const scrollToTop = () => {
    router.push("/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useIsomorphicLayoutEffect(() => {
    const isScrolled =
      window.scrollY > 20 ||
      sessionStorage.getItem("klyro_scrolled") === "true";

    if (isScrolled) {
      setScrolled(true);
    }
    const timer = setTimeout(() => {
      setCanAnimate(true);
    }, 150);

    const handleScroll = () => {
      const nextScrolled = window.scrollY > 20;
      setScrolled(nextScrolled);
      try {
        sessionStorage.setItem("klyro_scrolled", String(nextScrolled));
      } catch {}
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
      try {
        sessionStorage.setItem("klyro_scrolled", String(window.scrollY > 20));
      } catch {}
    };
  }, []);

  return (
    <div className="sticky top-5 z-50 flex justify-center select-none">
      <motion.nav
        initial={false}
        animate={
          scrolled
            ? {
                marginTop: "16px",
                marginLeft: "40px",
                marginRight: "40px",
                borderRadius: "16px",
                border: "3px solid rgba(255,255,255,0.1)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }
            : {
                marginTop: "0px",
                marginLeft: "0px",
                marginRight: "0px",
                borderRadius: "0px",
                border: "0px solid rgba(255,255,255,0)",
                boxShadow: "0 0px 0px rgba(0,0,0,0)",
              }
        }
        transition={{
          duration: canAnimate ? 0.4 : 0,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        className="w-full h-25 flex items-center justify-between p-4 mt-5 backdrop-blur-sm"
      >
        <div
          onClick={scrollToTop}
          className="flex items-center gap-2.5 p-3 cursor-pointer select-none"
        >
          <Image
            src="/favicon.svg"
            alt="Klyro-Logo"
            width={80}
            height={80}
            className="aspect-square"
          />
          <div className="flex gap-1.5 items-baseline">
            <h1 className="text-5xl font-extrabold">Klyro</h1>
            <h1 className="text-sm font-extrabold">v0.1.0</h1>
          </div>
        </div>
        <div className="flex items-center gap-4 p-3">
          <button
            className="text-white flex items-center justify-center px-4 py-3 bg-[#343a40] text-base font-bold gap-2 transition-all duration-500 hover:bg-[#1a1d27] hover:rounded-lg cursor-pointer"
            onClick={() =>
              window.open("https://github.com/Kernel0x19/klyro", "_blank")
            }
          >
            <Image
              src="/github-logo.svg"
              alt="Github-Logo"
              width={24}
              height={24}
              className="aspect-square"
            />
            Github
            <Image
              src="/github-star.svg"
              alt="Github-Star"
              width={16}
              height={16}
              className="aspect-square"
            />
            {starCount}
          </button>
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="text-white flex items-center justify-center p-3 bg-[#343a40] text-base font-bold transition-all duration-500 hover:bg-[#1a1d27] hover:rounded-lg cursor-pointer"
          >
            <Sun size={20} className="hidden dark:block" />
            <Moon size={20} className="block dark:hidden" />
          </button>
        </div>
      </motion.nav>
    </div>
  );
}
