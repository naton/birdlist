<script setup>
import { RouterLink, RouterView } from "vue-router";
</script>

<template>
    <main class="main">
        <RouterView />
    </main>
    <nav class="nav">
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
    </nav>
</template>

<style>
nav {
    width: 100%;
    text-align: center;
    margin-top: 1rem;
    padding: 1rem;
}

nav a.router-link-exact-active {
    color: var(--color-text);
}

nav a.router-link-exact-active:hover {
    background-color: transparent;
}

nav a {
    display: inline-block;
    padding: 0 1rem;
    border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
    border: 0;
}
</style>
