/** Animated totals make changes in portfolio filters easier to notice. */
import { useEffect, useRef, useState } from "react";
/** Assistive technology receives the final number instead of a stream of animation updates. */
export default function AnimatedValue({ value }: { value: string }) {
  const [display, setDisplay] = useState(value);
  const previous = useRef(0);
  useEffect(() => {
    const target = Number(value.replaceAll(",", ""));
    if (
      !Number.isFinite(target) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setDisplay(value);
      return;
    }
    const origin = previous.current;
    const start = performance.now();
    let frame = 0;
    /** Gradually slow the counter so large numbers settle without abrupt jumps. */
    const tick = (time: number) => {
      const progress = Math.min((time - start) / 1100, 1);
      const current =
        origin + (target - origin) * (1 - Math.pow(1 - progress, 4));
      previous.current = current;
      setDisplay(
        progress === 1
          ? value
          : new Intl.NumberFormat("en-IN", {
              maximumFractionDigits: value.includes(".") ? 1 : 0,
            }).format(current),
      );
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return (
    <span className="animated-value" aria-label={value}>
      <span aria-hidden="true">{display}</span>
    </span>
  );
}
