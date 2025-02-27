<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	// Scroll to features function
	function scrollToFeatures() {
		// Delay scrolling by 300ms to allow button animation to play
		setTimeout(() => {
			document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
		}, 300);
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
		<h1>{m.keyboard_name()}</h1>

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
		</div>
	</div>
</section>
