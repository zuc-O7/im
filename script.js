(function () {
  "use strict";

  const header = document.querySelector(".site-header");
  const navToggle = document.getElementById("nav-toggle");
  const yearEl = document.getElementById("year");
  const canvas = document.getElementById("webgl-canvas");

  let webglState = null;

  function closeNav() {
    if (!header || !navToggle) return;
    header.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "開啟選單");
  }

  function openNav() {
    if (!header || !navToggle) return;
    header.classList.add("is-open");
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "關閉選單");
  }

  function toggleNav() {
    if (!header || !navToggle) return;
    if (header.classList.contains("is-open")) {
      closeNav();
    } else {
      openNav();
    }
  }

  function initNavToggle() {
    if (!navToggle || !header) return;
    navToggle.addEventListener("click", toggleNav);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeNav();
    });

    window.addEventListener("resize", function () {
      if (window.matchMedia("(min-width: 768px)").matches) {
        closeNav();
      }
    });
  }

  function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]:not(.skip-link)');
    links.forEach(function (anchor) {
      anchor.addEventListener("click", function (e) {
        const id = anchor.getAttribute("href");
        if (!id || id === "#") return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        closeNav();
        if (history.replaceState) {
          history.replaceState(null, "", id);
        }
      });
    });
  }

  function initReveal() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.querySelectorAll(".reveal").forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    const elements = document.querySelectorAll(".reveal");
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.1 }
    );

    elements.forEach(function (el) {
      observer.observe(el);
    });
  }

  function initYear() {
    if (yearEl) {
      yearEl.textContent = String(new Date().getFullYear());
    }
  }

  function initWebGL() {
    if (!canvas || typeof THREE === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.z = 5.5;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const group = new THREE.Group();
    scene.add(group);

    const particleCount = 2400;
    const positions = new Float32Array(particleCount * 3);
    const radius = 2.2;

    for (let i = 0; i < particleCount; i += 1) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const r = radius * (0.85 + Math.random() * 0.3);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0xb9c0da,
      size: 0.018,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    group.add(particles);

    const coreGeo = new THREE.IcosahedronGeometry(1.35, 2);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xc4e7d4,
      wireframe: true,
      transparent: true,
      opacity: 0.22,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    const innerGeo = new THREE.IcosahedronGeometry(0.85, 1);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x998da0,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const inner = new THREE.Mesh(innerGeo, innerMat);
    group.add(inner);

    const ringGeo = new THREE.TorusGeometry(2.6, 0.012, 8, 120);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xb9c0da,
      transparent: true,
      opacity: 0.25,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI * 0.45;
    group.add(ring);

    const pointer = { x: 0, y: 0 };
    let targetRotX = 0;
    let targetRotY = 0;

    window.addEventListener(
      "pointermove",
      function (e) {
        pointer.x = (e.clientX / window.innerWidth - 0.5) * 2;
        pointer.y = (e.clientY / window.innerHeight - 0.5) * 2;
        targetRotY = pointer.x * 0.35;
        targetRotX = pointer.y * 0.25;
      },
      { passive: true }
    );

    let rafId = 0;
    const clock = new THREE.Clock();

    function animate() {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      group.rotation.y += 0.0018 + targetRotY * 0.002;
      group.rotation.x += (targetRotX - group.rotation.x) * 0.04;

      core.rotation.y = t * 0.25;
      core.rotation.x = t * 0.12;
      inner.rotation.y = -t * 0.35;
      inner.rotation.z = t * 0.18;
      ring.rotation.z = t * 0.08;

      particles.rotation.y = t * 0.04;

      renderer.render(scene, camera);
    }

    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener("resize", onResize);

    webglState = {
      stop: function () {
        cancelAnimationFrame(rafId);
        window.removeEventListener("resize", onResize);
        renderer.dispose();
        particleGeo.dispose();
        particleMat.dispose();
        coreGeo.dispose();
        coreMat.dispose();
        innerGeo.dispose();
        innerMat.dispose();
        ringGeo.dispose();
        ringMat.dispose();
      },
    };

    animate();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNavToggle();
    initSmoothScroll();
    initReveal();
    initYear();
    initWebGL();
  });
})();
