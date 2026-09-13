import { useEffect } from "react";

/** Ports the reveal-on-scroll behaviour from static/js/landing.js. */
export function useReveal() {
  useEffect(() => {
    const items = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!items.length) return;

    if (!("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const target = entry.target as HTMLElement;
          target.style.setProperty(
            "--reveal-delay",
            target.dataset["delay"] || target.style.getPropertyValue("--delay") || "0ms",
          );
          target.classList.add("is-visible");
          obs.unobserve(target);
        });
      },
      { threshold: 0.12 },
    );

    items.forEach((item) => observer.observe(item));

    const timeline = document.querySelector("[data-timeline]");
    let timelineObserver: IntersectionObserver | undefined;
    if (timeline) {
      timelineObserver = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) timeline.classList.add("is-active");
        },
        { threshold: 0.3 },
      );
      timelineObserver.observe(timeline);
    }

    return () => {
      observer.disconnect();
      timelineObserver?.disconnect();
    };
  }, []);
}
