<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useSettingsStore } from '../stores/settings.js'

const settingsStore = useSettingsStore()
const { t } = settingsStore

const vantaRef = ref();
let vantaEffect = null;

onMounted(async () => {
  window.THREE = await import('three');
  const { default: BIRDS } = await import("vanta/dist/vanta.birds.min");
  vantaEffect = BIRDS({
    el: vantaRef.value,
    THREE: window.THREE,
    mouseControls: false,
    touchControls: true,
    gyroControls: false,
    minHeight: 400.00,
    minWidth: 200.00,
    scale: 1.00,
    scaleMobile: 1.00,
    backgroundColor: 0xffffff,
    color1: 0x898989,
    color2: 0x4d4d4d,
    colorMode: "lerpGradient",
    birdSize: 0.80,
    wingSpan: 14.00,
    speedLimit: 9.00,
    separation: 41.00,
    alignment: 33.00,
    cohesion: 42.00,
    backgroundAlpha: 0.00,
  })
})

onBeforeUnmount(() => {
  if (vantaEffect) {
    vantaEffect.destroy()
  }
})
</script>

<template>
  <div class="about">
    <div class="about-content">
      <h1 class="hidden-visually">{{ t("About")}} Birdlist</h1>
      <picture>
        <source srcset="/logo.webp" type="image/webp" />
        <img src="/logo.png" alt="Birdlist" width="460" height="170" class="logo" />
      </picture>
      <h2>
        {{ t("Log_Your_Bird_Observations") }}.<br />
        {{ t("Make_Lists") }}.<br />
        {{ t("Share_With_Friends") }}.
      </h2>

      <div class="privacy-notes margin-bottom">
        <h3>{{ t("Personal_Data_Processing") }}</h3>
        <p>{{ t("By_Using_Birdlist_Info") }}</p>
      </div>
    </div>
  </div>
  <div ref="vantaRef" class="birds-anim"></div>
</template>

<style>
.birds-anim {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.birds-anim canvas {
  filter: invert(0.5);
}

.about {
  display: grid;
  place-items: center;
  padding: 1rem;
  align-content: center;
}  

.about-content {
  width: 25rem;
  max-width: 85vw;
}

.about .logo {
  display: flex;
  max-width: 100%;
  height: auto;
  margin-bottom: 2rem;
}

.privacy-notes {
  max-width: 45ch;
  margin-top: 2rem;
  font-size: 0.9rem;
}
</style>
