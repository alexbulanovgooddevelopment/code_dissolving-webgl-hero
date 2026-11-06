import * as THREE from "three";
import { vertexShader, fragmentShader } from "./shaders.js";

document.addEventListener("DOMContentLoaded", async () => {
  await document.fonts.ready;

  // SplitText регистрируется сам. Явная регистрация создаёт глобальную
  // переменную `e` (имя его минифицированного класса) и ломает Lenis
  gsap.registerPlugin(ScrollTrigger);

  const CONFIG = {
    color: "#ebf5df",
    spread: 0.5,
    speed: 1.5,
    maxProgress: 1.1,
    smoothing: 0.1,
  };

  const hero = document.querySelector(".hero");
  const canvas = document.querySelector(".hero-canvas");
  const heroTitle = document.querySelector(".hero-content h2");

  if (!hero || !canvas || !heroTitle) return;

  // Плавная прокрутка отключается, а растворение остаётся:
  // оно идёт только вслед за прокруткой самого пользователя
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const lenis = new Lenis();

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  });

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    uniforms: {
      uProgress: { value: 0 },
      uResolution: { value: new THREE.Vector2() },
      uColor: { value: new THREE.Color(CONFIG.color) },
      uSpread: { value: CONFIG.spread },
    },
  });

  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

  function render() {
    renderer.render(scene, camera);
  }

  function resize() {
    const { offsetWidth: width, offsetHeight: height } = hero;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    material.uniforms.uResolution.value.set(width, height);
    render(); // setSize очищает холст
  }

  resize();
  window.addEventListener("resize", resize);

  let progress = 0;
  let targetProgress = 0;

  function updateTarget(self) {
    targetProgress = Math.min(self.progress * CONFIG.speed, CONFIG.maxProgress);
  }

  ScrollTrigger.create({
    trigger: hero,
    start: "top top",
    end: "bottom bottom",
    onUpdate: updateTarget,
    onRefresh: updateTarget,
  });

  // Перерисовываем только пока значение меняется
  gsap.ticker.add(() => {
    const delta = targetProgress - progress;
    if (Math.abs(delta) < 0.0001) return;

    progress += delta * CONFIG.smoothing;
    material.uniforms.uProgress.value = progress;
    render();
  });

  const { words } = new SplitText(heroTitle, { type: "words" });

  // Слова проявляются по очереди: stagger равен длительности одного слова
  gsap.fromTo(
    words,
    { opacity: 0 },
    {
      opacity: 1,
      duration: 1,
      stagger: 1,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero-content",
        start: "top 25%",
        end: "bottom 100%",
        scrub: true,
      },
    },
  );
});
