import { useCallback, useEffect, useRef, useState } from "react";

export function useResizable(initial: number, min: number, max: number, inverted = false) {
  const sizeRef = useRef(initial);
  const [size, setSize] = useState(initial);
  const startX = useRef(0);
  const startSize = useRef(initial);

  useEffect(() => {
    sizeRef.current = size;
  }, [size]);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      startX.current = e.clientX;
      startSize.current = sizeRef.current;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const onMouseMove = (ev: MouseEvent) => {
        const delta = (ev.clientX - startX.current) * (inverted ? -1 : 1);
        const next = Math.min(max, Math.max(min, startSize.current + delta));
        sizeRef.current = next;
        setSize(next);
      };

      const onMouseUp = () => {
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [min, max, inverted]
  );

  return { size, onMouseDown };
}
