/** Altura do menu inferior mobile (h-[60px]) + safe-area. */
export const REELS_BOTTOM_NAV_OFFSET =
  "calc(60px + env(safe-area-inset-bottom))";

export const REELS_CONTENT_BOTTOM =
  "calc(80px + env(safe-area-inset-bottom))";

export const REELS_SLIDE_CLASS = "relative h-[100dvh] w-full snap-start snap-always shrink-0 overflow-hidden bg-black";

export const REELS_SCROLL_CLASS =
  "h-[100dvh] w-full overflow-y-scroll overflow-x-hidden overscroll-contain scroll-smooth snap-y snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
