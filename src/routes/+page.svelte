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

<section>
	<div>
		<h1>{KEYBOARD_NAME}</h1>

		<div>
			<img src="/board.jpeg" alt="Split Keyboard" />
			<a href="/shop">Buy Now</a>
		</div>

		<button type="button" on:click={scrollToFeatures} aria-label="Scroll to features">
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M19 14l-7 7m0 0l-7-7m7 7V3"
				/>
			</svg>
		</button>

		<div id="features">
			<div>
				{#each features as feature}
					<div>
						<div>{feature.icon}</div>
						<h3>{feature.title}</h3>
						<p>{feature.desc}</p>
					</div>
				{/each}
			</div>

			<div>
				{#if currentFeature > 0}
					<button type="button" on:click={prevFeature} aria-label="Previous feature">&lt;</button>
				{/if}
				<div>
					<div style="transform: translateX(-{currentFeature * 100}%);">
						{#each features as feature, index}
							<div>
								<div>{feature.icon}</div>
								<h3>{feature.title}</h3>
								<p>{feature.desc}</p>
							</div>
						{/each}
					</div>
				</div>
				{#if currentFeature < features.length - 1}
					<button type="button" on:click={nextFeature} aria-label="Next feature">&gt;</button>
				{/if}
			</div>
		</div>
	</div>
</section>
