import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createMacBookWebGL } from './macBookWebGL';
import wallpaperUrl from './generated/assets/seamless-desktop.webp';

gsap.registerPlugin(ScrollTrigger);

export function mountSeamlessMotion(scene: HTMLDivElement, track: HTMLDivElement, device: HTMLDivElement, canvas: HTMLCanvasElement, onSettled: () => void) {
    const revealText = device.querySelector<HTMLElement>(
      ".seamless-macbook__reveal",
    )!;
    const media = gsap.matchMedia();
    let renderer: Awaited<ReturnType<typeof createMacBookWebGL>> = null;
    let disposed = false;
    const pose = { fold: 0 };
    let benchmarkFreezeWallpaper = false;
    const isMobile = () => window.matchMedia('(max-width: 768px)').matches;
    const scrollDistance = () => isMobile()
      ? Math.max(450, window.innerHeight * .9)
      : Math.max(800, window.innerHeight * 1.35);
    const sceneTop = () => (window.innerHeight - scene.offsetHeight) / 2
      + (document.querySelector('.site-header')?.getBoundingClientRect().height ?? 72) / 2;
    const syncSceneLayout = () => {
      if (!track.classList.contains("seamless-section__track--animated"))
        return;
      track.style.height = `${scene.offsetHeight + scrollDistance()}px`;
      track.style.setProperty("--scene-top", `${sceneTop()}px`);
    };
    const render = () => {
      const closure = pose.fold / 90;
      const reveal = Math.max(0, Math.min(1, (closure - 0.25) / 0.45));
      revealText.style.opacity = String(reveal * reveal * (3 - 2 * reveal));
      renderer?.render(pose.fold, benchmarkFreezeWallpaper);
    };
    const resize = () => {
      device.style.setProperty(
        "--macbook-scale",
        String(device.clientWidth / 900),
      );
      renderer?.resize(device.clientWidth, window.devicePixelRatio);
      syncSceneLayout();
      render();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(device);
    observer.observe(scene);
    resize();

    const image = new Image();
    image.onload = () => {
      if (disposed) return;
      media.add(
        "(prefers-reduced-motion: no-preference)",
        () => {
          let active = true;
          const controller = new AbortController();
          let timeline: gsap.core.Timeline | undefined;
          let removeBenchmark: (() => void) | undefined;
          void createMacBookWebGL(
            canvas,
            device,
            image,
            controller.signal,
          ).then((nextRenderer) => {
            if (!active || disposed) {
              nextRenderer?.dispose();
              return;
            }
            renderer = nextRenderer;
            if (!renderer) { onSettled(); return; }
            renderer.resize(device.clientWidth, window.devicePixelRatio);
            render();
            device.classList.add(
              "seamless-macbook--animated",
              "seamless-macbook--webgl",
            );
            track.classList.add("seamless-section__track--animated");
            syncSceneLayout();
            onSettled();
            timeline = gsap.timeline({
              scrollTrigger: {
                trigger: track,
                start: () => `top top+=${sceneTop()}`,
                end: () => `+=${scrollDistance()}`,
                // Native sticky positioning follows Safari's scrolling thread;
                // JS only controls the pose, not the scene's viewport position.
                onRefreshInit: syncSceneLayout,
                scrub: 0.4,
                invalidateOnRefresh: true,
              },
              onUpdate: render,
            });
            // One monotonic gesture: down closes the physical lid; up reopens it.
            // The eased final degrees bring the lid gently onto the base.
            timeline.to(pose, {
              fold: 90,
              duration: 1,
              ease: "power1.inOut",
            });
            if (
              import.meta.env.DEV &&
              new URLSearchParams(location.search).has("motion-benchmark")
            ) {
              void import("./seamlessBenchmark").then(({ attachBenchmark }) => {
                if (!active) return;
                removeBenchmark = attachBenchmark(
                  timeline!.scrollTrigger!,
                  (frozen) => {
                    benchmarkFreezeWallpaper = frozen;
                    render();
                  },
                  () =>
                    canvas
                      .getContext("webgl2")
                      ?.getExtension("WEBGL_lose_context")
                      ?.loseContext(),
                );
              });
            }
            // Local fonts can settle after mount and change the sticky start offset.
            void document.fonts.ready.then(() => {
              if (!disposed) ScrollTrigger.refresh();
            });
          }).catch(() => { if (active && !disposed) onSettled(); });
          return () => {
            active = false;
            controller.abort();
            timeline?.revert();
            removeBenchmark?.();
            device.classList.remove(
              "seamless-macbook--animated",
              "seamless-macbook--webgl",
            );
            track.classList.remove("seamless-section__track--animated");
            track.style.removeProperty("height");
            track.style.removeProperty("--scene-top");
            renderer?.dispose();
            renderer = null;
            pose.fold = 0;
            render();
          };
        },
      );
    };
    const handleContextLoss = (event: Event) => {
      event.preventDefault();
      media.revert();
    };
    canvas.addEventListener("webglcontextlost", handleContextLoss);
    image.onerror = onSettled;
    image.fetchPriority = 'low';
    image.src = wallpaperUrl;

    return () => {
      disposed = true;
      image.onload = null;
      image.onerror = null;
      observer.disconnect();
      media.revert();
      canvas.removeEventListener("webglcontextlost", handleContextLoss);
      device.style.removeProperty("--macbook-scale");
    };
}
