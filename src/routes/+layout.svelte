<script lang="ts">
	// Import the localization wrapper and i18n instance.
	import '../app.css';
	// Import global components.
	import Footer from '$lib/components/Footer.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import { ParaglideJS } from '@inlang/paraglide-sveltekit';
	import { i18n } from '$lib/i18n';

	// Destructure the renderable children (avoid using <slot> per Svelte 5 guidelines).
	let { data, children } = $props();

	// ★ Added star generation functions and array ★
	function random(min: number, max: number) {
		return Math.random() * (max - min) + min;
	}

	const starCount = 288;
	const stars = Array.from({ length: starCount }, () => {
		const size = random(1, 6);
		const cluster = Math.random() > 0.7;
		const baseX = random(0, 100);
		const baseY = random(0, 100);
		const offset = cluster ? random(-5, 5) : 0;
		return {
			size,
			top: baseY + offset,
			left: baseX + offset,
			delay: random(0, 2),
			opacity: random(0.3, 1),
			blur: Math.random() > 0.8 ? `${random(1, 2)}px` : '0px'
		};
	});
</script>

<ParaglideJS {i18n}>
	<div class="relative min-h-screen overflow-hidden">
		<!-- Star background layer -->
		<div class="star-background pointer-events-none fixed inset-0 z-0">
			{#each stars as star}
				<div
					class="star"
					style="width: {star.size}px; height: {star.size}px; top: {star.top}%; left: {star.left}%; animation-delay: {star.delay}s; opacity: {star.opacity}; filter: blur({star.blur}); transform: rotate({random(
						0,
						360
					)}deg);"
				></div>
			{/each}
		</div>

		<!-- Noise overlay layer -->
		<div class="noise-wrapper pointer-events-none fixed inset-0 z-0">
			<div class="noise"></div>
		</div>

		<!-- Content layer -->
		<div class="font-overpass relative z-10 flex min-h-screen flex-col antialiased">
			<Navbar user={data.user} />
			<main class="container mx-auto flex-1 px-4 py-12 sm:px-6 lg:px-8">
				{@render children()}
			</main>
			<Footer />
		</div>
	</div>
</ParaglideJS>

<style>
	.noise-wrapper {
		background-color: transparent;
		overflow: hidden;
	}

	.noise {
		position: absolute;
		inset: -400px;
		background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 2000 2000' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.25' numOctaves='5' seed='5' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0.35 0'/%3E%3CfeComponentTransfer%3E%3CfeFuncR type='discrete' tableValues='0 0.1 0.2 1'/%3E%3CfeFuncG type='discrete' tableValues='0 0.1 0.2 1'/%3E%3CfeFuncB type='discrete' tableValues='0 0.1 0.2 1'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' fill='white'/%3E%3C/svg%3E");
		opacity: 0.12;
		filter: contrast(250%) brightness(120%) grayscale(100%);
		mix-blend-mode: overlay;
		animation: noise 12s steps(12) infinite;
	}

	@keyframes noise {
		0% {
			transform: translate3d(0, 0, 0) scale(1);
		}
		25% {
			transform: translate3d(-3%, 2%, 0) rotate(0.5deg) scale(1.02);
		}
		50% {
			transform: translate3d(2%, -1%, 0) rotate(-0.5deg) scale(0.98);
		}
		75% {
			transform: translate3d(-2%, -2%, 0) rotate(0.25deg) scale(1.01);
		}
		100% {
			transform: translate3d(0, 0, 0) scale(1);
		}
	}

	.noise-wrapper::after {
		content: '';
		position: absolute;
		inset: 0;
		background:
			radial-gradient(circle at 30% 40%, rgba(255, 255, 255, 0.03) 0%, transparent 45%),
			radial-gradient(circle at 70% 60%, rgba(255, 255, 255, 0.02) 0%, transparent 35%);
		pointer-events: none;
	}

	:global(body::after) {
		content: '';
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.2) 100%);
		pointer-events: none;
		z-index: -1;
	}

	/* ★ Added styles for the starry background ★ */
	.star-background {
		position: fixed;
		inset: 0;
		z-index: -10;
		pointer-events: none;
	}
	.star {
		position: absolute;
		background: radial-gradient(
			circle at center,
			rgba(255, 255, 255, 1) 0%,
			rgba(255, 255, 255, 0) 100%
		);
		animation: twinkle 2s ease-in-out infinite;
	}
	@keyframes twinkle {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.3);
		}
	}
</style>
