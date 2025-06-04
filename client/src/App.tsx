import React, { useRef, useEffect, useState } from "react";
import io from "socket.io-client";
import "./index.css";

const socket = io("http://localhost:5001");

const App = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [roomId] = useState("default");
  const [color, setColor] = useState("#4f46e5"); // Indigo by default
  const [size, setSize] = useState(4);

  type DrawAction = {
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    color: string;
    size: number;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    socket.emit("join-room", roomId);

    socket.on("load-board", (actions: DrawAction[]) => {
      actions.forEach((action: DrawAction) => draw(action, ctx));
    });

    socket.on("draw", (action: DrawAction) => {
      draw(action, ctx);
    });

    socket.on("clear-board", () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    let drawing = false;
    let lastX: number | null = null;
    let lastY: number | null = null;

    const handleMouseDown = (e: MouseEvent) => {
      drawing = true;
      const rect = canvas.getBoundingClientRect();
      lastX = e.clientX - rect.left;
      lastY = e.clientY - rect.top;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!drawing) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx || !canvas || lastX === null || lastY === null) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const action: DrawAction = {
        fromX: lastX,
        fromY: lastY,
        toX: x,
        toY: y,
        color,
        size,
      };

      draw(action, ctx);
      socket.emit("draw", { roomId, action });

      lastX = x;
      lastY = y;
    };

    const handleMouseUp = () => {
      drawing = false;
      lastX = null;
      lastY = null;
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [roomId, color, size]);

  const draw = (action: DrawAction, ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = action.color;
    ctx.lineWidth = action.size;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(action.fromX, action.fromY);
    ctx.lineTo(action.toX, action.toY);
    ctx.stroke();
  };

  const clearBoard = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit("clear-board", roomId);
  };

  return (
    <div className="app">
      <h1>CollabBoard</h1>
      <div className="controls">
        <label htmlFor="color-picker">Brush Color:</label>
        <input
          id="color-picker"
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
        <label htmlFor="size-range">Size:</label>
        <input
          id="size-range"
          type="range"
          min="1"
          max="10"
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
        />
        <button onClick={clearBoard}>Clear</button>
      </div>
      <canvas ref={canvasRef} width={800} height={600} className="canvas" />
    </div>
  );
};

export default App;
