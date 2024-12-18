import Spheres2Background from "https://cdn.jsdelivr.net/npm/threejs-components@0.0.8/build/backgrounds/spheres2.cdn.min.js";
import Lenis from "lenis";

const randomNumber = Math.floor(Math.random() * 50) + 10;

document.addEventListener("DOMContentLoaded", () => {
  // 3D Background
  const canvas = document.getElementById("webgl-canvas");

  setTimeout(() => {
    canvas.classList.add("fadeIn");
  }, 100);

  const bg = Spheres2Background(canvas, {
    count: randomNumber,
    colors: [0xff0000, 0x330000, 0xffffff],
    minSize: 0.5,
    maxSize: 1,
  });

  // GSAP + ScrollTrigger
  gsap.registerPlugin(ScrollTrigger);

  // Lenis
  const lenis = new Lenis();

  lenis.on("scroll", ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);

  // Horizontal Scroll Animation
  const horizontalScrollContent = document.querySelector("#ponentes > div");

  if (horizontalScrollContent) {
    gsap.to(horizontalScrollContent, {
      x: () =>
        -(horizontalScrollContent.scrollWidth - window.innerWidth) + "px",
      ease: "none",
      scrollTrigger: {
        trigger: "#ponentes",
        start: "center center",
        end: () => `+=${horizontalScrollContent.scrollWidth}`,
        scrub: 1,
        pin: true,
      },
    });
  }
});
