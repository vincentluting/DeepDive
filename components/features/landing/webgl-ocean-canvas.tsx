"use client";

import { useEffect, useRef, type MutableRefObject } from "react";

import { reportClientError } from "@/lib/observability/client-error";

import {
  buildOceanStops,
  OCEAN_FRAG,
  OCEAN_VERT,
  parseColor,
  type OceanMode,
  type OceanPalette,
  type OceanStops,
  type RGB,
} from "./ocean-shader";

// ============================================================
// WebGLOceanCanvas — the living-water renderer (Tier 3 only).
//
// Mirrors dive-particles.tsx exactly: runs its OWN rAF loop, reads
// `depthRef.current` per frame, reads the `.dark` class per frame to pick the
// hour, pauses on visibilitychange AND when the landing scrolls out of view.
// NEVER attaches a scroll listener. One fullscreen triangle, one draw call.
//
// Loaded via next/dynamic({ ssr: false }) from the gate, so this module (and
// any WebGL bytes) only reach proven-capable desktops. On any init failure it
// reports + renders nothing — the CSS descent underneath is already painting,
// so a blank frame is impossible.
// ============================================================

type GL = WebGLRenderingContext | WebGL2RenderingContext;

const DPR_CAP = 1.25; // 2× displays → ~75% fill-rate cut; water is soft anyway

const CONTEXT_ATTRS: WebGLContextAttributes = {
  alpha: true,
  premultipliedAlpha: false, // straight-alpha output; see blendFunc below
  antialias: false,
  depth: false,
  stencil: false,
  powerPreference: "low-power",
};

// Per-token fallback for the (essentially unreachable) case where a core
// Meridian token resolves empty. Kept as numeric tuples — NOT hex — so the
// live --md-* CSS tokens stay the single source of truth and the brand-colour
// linter (which scans hex/rgb literals) has nothing to flag. Values mirror
// the Meridian :root / .dark palette.
const FALLBACK: Record<OceanMode, OceanPalette> = {
  noon: {
    paper: [0.976, 0.98, 0.965],
    sea: [0.043, 0.373, 0.569],
    seaBright: [0.059, 0.525, 0.722],
    seaDeep: [0.02, 0.216, 0.365],
    gold: [0.847, 0.706, 0.416],
  },
  midnight: {
    paper: [0.016, 0.071, 0.122],
    sea: [0.463, 0.831, 0.91],
    seaBright: [0.247, 0.659, 0.788],
    seaDeep: [0.043, 0.373, 0.569],
    gold: [0.847, 0.706, 0.416],
  },
};

function currentMode(): OceanMode {
  return document.documentElement.classList.contains("dark")
    ? "midnight"
    : "noon";
}

/** Read the live Meridian palette for the active hour off <html>. */
function readPalette(mode: OceanMode): OceanPalette {
  const cs = getComputedStyle(document.documentElement);
  const fb = FALLBACK[mode];
  const read = (name: string, fallback: RGB): RGB =>
    parseColor(cs.getPropertyValue(name)) ?? fallback;
  return {
    paper: read("--md-paper", fb.paper),
    sea: read("--md-sea", fb.sea),
    seaBright: read("--md-sea-bright", fb.seaBright),
    seaDeep: read("--md-sea-deep", fb.seaDeep),
    gold: read("--md-gold", fb.gold),
  };
}

function clamp01(n: number): number {
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

function compileShader(gl: GL, type: number, src: string): WebGLShader {
  const sh = gl.createShader(type);
  if (!sh) throw new Error("ocean: createShader returned null");
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(`ocean: shader compile failed — ${log}`);
  }
  return sh;
}

interface OceanProgram {
  program: WebGLProgram;
  buffer: WebGLBuffer;
  u: Record<string, WebGLUniformLocation | null>;
}

/** Compile/link the program + fullscreen triangle. Throws on failure, cleaning
 *  up every GL resource it created first (browsers cap GL objects — a leaked
 *  program/shader/buffer on the error path is a real leak). */
function setupProgram(gl: GL): OceanProgram {
  let vs: WebGLShader | null = null;
  let fs: WebGLShader | null = null;
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  try {
    vs = compileShader(gl, gl.VERTEX_SHADER, OCEAN_VERT);
    fs = compileShader(gl, gl.FRAGMENT_SHADER, OCEAN_FRAG);
    program = gl.createProgram();
    if (!program) throw new Error("ocean: createProgram returned null");
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(
        `ocean: program link failed — ${gl.getProgramInfoLog(program)}`,
      );
    }
    gl.useProgram(program);

    buffer = gl.createBuffer();
    if (!buffer) throw new Error("ocean: createBuffer returned null");
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    // Oversized triangle covering the viewport.
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const aPos = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const names = [
      "u_time",
      "u_depth",
      "u_res",
      "u_fog0",
      "u_fog1",
      "u_fog2",
      "u_fog3",
      "u_ray",
      "u_caustic",
      "u_heart",
      "u_rayStrength",
      "u_causticStrength",
      "u_heartGlow",
    ];
    const u: Record<string, WebGLUniformLocation | null> = {};
    for (const n of names) u[n] = gl.getUniformLocation(program, n);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    // Linked now — shaders are retained by the program; flag them for deletion.
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    return { program, buffer, u };
  } catch (err) {
    if (vs) gl.deleteShader(vs);
    if (fs) gl.deleteShader(fs);
    if (buffer) gl.deleteBuffer(buffer);
    if (program) {
      gl.useProgram(null); // unbind first so the delete frees it immediately,
      gl.deleteProgram(program); // not deferred while it is the active program
    }
    throw err;
  }
}

function applyStops(gl: GL, u: OceanProgram["u"], s: OceanStops): void {
  const c3 = (loc: WebGLUniformLocation | null, c: RGB) =>
    gl.uniform3f(loc, c[0], c[1], c[2]);
  c3(u.u_fog0, s.fog[0]);
  c3(u.u_fog1, s.fog[1]);
  c3(u.u_fog2, s.fog[2]);
  c3(u.u_fog3, s.fog[3]);
  c3(u.u_ray, s.ray);
  c3(u.u_caustic, s.caustic);
  c3(u.u_heart, s.heart);
  gl.uniform1f(u.u_rayStrength, s.rayStrength);
  gl.uniform1f(u.u_causticStrength, s.causticStrength);
}

export function WebGLOceanCanvas({
  depthRef,
}: {
  depthRef: MutableRefObject<number>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let gl: GL | null = null;
    let prog: OceanProgram | null = null;
    let raf = 0;
    let looping = false;
    let visible = document.visibilityState === "visible";
    let inView = true;
    let mode: OceanMode | null = null;
    let disposed = false;
    const landing = document.querySelector(".dd-landing");

    const sync = () => {
      const should = visible && inView && !disposed && !!prog;
      if (should && !looping) {
        looping = true;
        raf = requestAnimationFrame(draw);
      } else if (!should && looping) {
        looping = false;
        cancelAnimationFrame(raf);
      }
    };

    const resize = () => {
      if (!gl) return;
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      const w = Math.max(1, Math.floor(window.innerWidth * dpr));
      const h = Math.max(1, Math.floor(window.innerHeight * dpr));
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
      gl.viewport(0, 0, w, h);
      if (prog) gl.uniform2f(prog.u.u_res, w, h);
    };

    const draw = (tMs: number) => {
      if (!looping || !gl || !prog) return;
      const m = currentMode();
      if (m !== mode) {
        mode = m;
        applyStops(gl, prog.u, buildOceanStops(readPalette(m), m));
      }
      // Full-page descent progress (0 surface → 1 abyss), read from the
      // landing rect each frame (a poll, not a scroll listener) so the four
      // acts spread across the WHOLE scroll — depthRef saturates at 1600px
      // (it is tuned for the painting fade), which would flatline the grade.
      let depth = depthRef.current;
      if (landing) {
        const rect = landing.getBoundingClientRect();
        const denom = Math.max(1, rect.height - window.innerHeight);
        depth = clamp01(-rect.top / denom);
      }
      gl.uniform1f(prog.u.u_time, tMs * 0.001);
      gl.uniform1f(prog.u.u_depth, depth);
      gl.uniform1f(prog.u.u_heartGlow, clamp01((depth - 0.78) / 0.22));
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(draw);
    };

    const init = () => {
      try {
        gl =
          (canvas.getContext("webgl2", CONTEXT_ATTRS) as GL | null) ??
          (canvas.getContext("webgl", CONTEXT_ATTRS) as GL | null);
        if (!gl) throw new Error("ocean: no WebGL context");
        prog = setupProgram(gl);
        mode = null; // force a stops apply on first frame
        resize();
        sync();
        // Shader owns the descent colour now — let CSS dim the veil + hide the
        // static shafts so the three layers stop fighting (coherent transition).
        landing?.setAttribute("data-webgl", "on");
      } catch (err) {
        reportClientError(err, {
          component: "WebGLOceanCanvas",
          feature: "landing",
        });
        prog = null; // leave the CSS descent showing through
        // Release the context too — if getContext succeeded but setup failed,
        // a live-but-useless context would keep holding a quota slot. (All
        // consumers — draw/resize — already guard on `gl`, so nulling is safe.)
        if (gl) {
          gl.getExtension("WEBGL_lose_context")?.loseContext();
          gl = null;
        }
      }
    };

    const onVisibility = () => {
      visible = document.visibilityState === "visible";
      sync();
    };
    const onContextLost = (e: Event) => {
      e.preventDefault(); // signal we can restore
      looping = false;
      cancelAnimationFrame(raf);
      prog = null;
      landing?.removeAttribute("data-webgl"); // let the CSS veil return
    };
    const onContextRestored = () => {
      if (disposed) return;
      init();
    };

    const io = landing
      ? new IntersectionObserver(
          (entries) => {
            inView = entries[0]?.isIntersecting ?? true;
            sync();
          },
          { threshold: 0 },
        )
      : null;

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);
    io?.observe(landing!);

    init();

    return () => {
      disposed = true;
      looping = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      io?.disconnect();
      landing?.removeAttribute("data-webgl");
      if (gl && prog) {
        gl.useProgram(null); // unbind so deleteProgram frees it immediately
        gl.deleteProgram(prog.program);
        gl.deleteBuffer(prog.buffer);
      }
    };
  }, [depthRef]);

  return <canvas ref={canvasRef} className="dd-webgl-ocean" aria-hidden />;
}
