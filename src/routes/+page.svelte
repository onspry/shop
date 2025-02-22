<script lang="ts">
	// Keyboard name as a constant
	const KEYBOARD_NAME = 'Typoono';

	// Scroll to features function
	function scrollToFeatures() {
		// Delay scrolling by 300ms to allow button animation to play
		setTimeout(() => {
			document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
		}, 300);
	}

	// Add carousel logic for mobile rotator
	let currentFeature = 0;

	function prevFeature() {
		if (currentFeature > 0) {
			currentFeature--;
		}
	}

	function nextFeature() {
		if (currentFeature < features.length - 1) {
			currentFeature++;
		}
	}

	// Key features of the keyboard
	const features = [
		{ icon: '⚡', title: 'Split Design', desc: 'Ergonomic comfort for extended typing sessions' },
		{ icon: '🔧', title: 'Customizable', desc: 'Hot-swappable switches for your perfect feel' },
		{ icon: '💫', title: 'Handschmeichler', desc: 'Comfort with zero compromise' }
	];
</script>

<section class="relative px-4 pt-8 md:pt-12">
	<div class="container mx-auto">
		<h1 class="used-text mb-12 text-center text-5xl font-bold md:text-6xl lg:text-7xl">
			{KEYBOARD_NAME}
		</h1>

		<!-- Main image with floating elements -->
		<div class="relative mx-auto flex w-full max-w-3xl flex-col items-center">
			<img
				src="/board.jpeg"
				alt="Split Keyboard"
				class="border-glow relative h-[300px] w-[1500px] max-w-full rounded-lg object-cover transition-transform duration-700 hover:scale-[1.02]"
			/>
			<a
				href="/shop"
				class="used-look mt-8 inline-block rounded-full bg-[var(--color-accent)] px-8 py-4 text-lg font-bold text-gray-900 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:bg-[var(--color-accent-hover)] hover:shadow-2xl md:px-12 md:py-5 md:text-xl"
			>
				Buy Now
			</a>
		</div>
		<!-- Scroll indicator -->
		<button
			type="button"
			on:click={scrollToFeatures}
			class="mx-auto mt-12 flex cursor-pointer justify-center focus:outline-none"
			aria-label="Scroll to features"
		>
			<div class="animate-bounce rounded-full border-2 border-yellow-500/50 p-2">
				<svg class="h-6 w-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 14l-7 7m0 0l-7-7m7 7V3"
					/>
				</svg>
			</div>
		</button>
		<!-- Features section -->
		<div id="features">
			<!-- Desktop version -->
			<div class="mt-24 hidden flex-row justify-evenly gap-8 md:flex">
				{#each features as feature}
					<div
						class="group relative flex-1 rounded-xl bg-gray-900/50 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-gray-900/70"
					>
						<div class="mb-4 text-4xl">{feature.icon}</div>
						<h3 class="used-text mb-2 text-xl font-bold">{feature.title}</h3>
						<p class="text-gray-400">{feature.desc}</p>
						<div
							class="absolute inset-0 rounded-xl ring-1 ring-white/10 transition-all duration-300 group-hover:ring-yellow-500/50"
						></div>
					</div>
				{/each}
			</div>

			<!-- Mobile carousel version -->
			<div class="relative mt-24 flex md:hidden">
				{#if currentFeature > 0}
					<button
						type="button"
						on:click={prevFeature}
						class="absolute top-1/2 left-0 z-10 -translate-y-1/2 transform p-2 text-yellow-500"
						aria-label="Previous feature"
					>
						&lt;
					</button>
				{/if}
				<div class="w-full overflow-hidden px-16">
					<div
						class="flex transition-transform duration-500"
						style="transform: translateX(-{currentFeature * 100}%);"
					>
						{#each features as feature, index}
							<div
								class="group relative w-full flex-shrink-0 rounded-xl bg-gray-900/50 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-gray-900/70"
								class:active={index === currentFeature}
							>
								<div class="mb-4 text-4xl">{feature.icon}</div>
								<h3 class="used-text mb-2 text-xl font-bold">{feature.title}</h3>
								<p class="text-gray-400">{feature.desc}</p>
								<div
									class="absolute inset-0 rounded-xl ring-1 ring-white/10 transition-all duration-300 group-hover:ring-yellow-500/50"
								></div>
							</div>
						{/each}
					</div>
				</div>
				{#if currentFeature < features.length - 1}
					<button
						type="button"
						on:click={nextFeature}
						class="absolute top-1/2 right-0 z-10 -translate-y-1/2 transform p-2 text-yellow-500"
						aria-label="Next feature"
					>
						&gt;
					</button>
				{/if}
			</div>
		</div>
	</div>
</section>

<style>
	@keyframes expand {
		0%,
		100% {
			transform: translate(-50%, -50%) scale(1);
		}
		50% {
			transform: translate(-50%, -50%) scale(1.2);
		}
	}

	.border-glow {
		border: 3px solid rgba(255, 215, 0, 0.4);
		box-shadow:
			0 0 100px rgba(255, 215, 0, 0.2),
			0 0 200px rgba(255, 215, 0, 0.15),
			0 0 300px rgba(255, 215, 0, 0.1),
			0 0 400px rgba(255, 215, 0, 0.05),
			inset 0 0 40px rgba(255, 215, 0, 0.1),
			inset 0 0 80px rgba(255, 215, 0, 0.05);
		animation: border-pulse 4s ease-in-out infinite;
	}

	@keyframes border-pulse {
		0%,
		100% {
			border-color: rgba(255, 215, 0, 0.3);
			box-shadow:
				0 0 100px rgba(255, 215, 0, 0.16),
				0 0 200px rgba(255, 215, 0, 0.12),
				0 0 300px rgba(255, 215, 0, 0.08),
				0 0 400px rgba(255, 215, 0, 0.04),
				inset 0 0 40px rgba(255, 215, 0, 0.08),
				inset 0 0 80px rgba(255, 215, 0, 0.04),
				4px 4px 150px rgba(255, 215, 0, 0.18);
		}
		50% {
			border-color: rgba(255, 215, 0, 0.4);
			box-shadow:
				0 0 150px rgba(255, 215, 0, 0.25),
				0 0 300px rgba(255, 215, 0, 0.2),
				0 0 450px rgba(255, 215, 0, 0.15),
				0 0 600px rgba(255, 215, 0, 0.1),
				inset 0 0 60px rgba(255, 215, 0, 0.15),
				inset 0 0 120px rgba(255, 215, 0, 0.1),
				4px 4px 200px rgba(255, 215, 0, 0.3);
		}
	}

	/* Active class for mobile carousel feature, mimicking hover state */
	.active {
		transform: translateY(-0.25rem);
		background-color: rgba(17, 24, 39, 0.7); /* Matches bg-gray-900/70 */
	}
</style>
