<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { ImageOff } from 'lucide-svelte';

	let imageError = $state(false);
	let imageLoaded = $state(false);

	function handleImageError() {
		imageError = true;
	}

	function handleImageLoad() {
		imageLoaded = true;
	}
</script>

<div class="relative w-full overflow-hidden">
	<div class="flex flex-col items-center justify-center py-12 w-full">
		<h1 class="font-onest text-6xl font-light text-primary md:text-8xl mb-8">
			{m.keyboard_name()}
		</h1>

		<div class="w-full max-w-4xl mx-auto px-4 relative">
			{#if !imageLoaded && !imageError}
				<div class="w-full aspect-[16/9] bg-muted animate-pulse rounded-lg"></div>
			{/if}

			{#if imageError}
				<div class="w-full aspect-[16/9] bg-muted rounded-lg flex items-center justify-center">
					<ImageOff class="h-16 w-16 text-muted-foreground" />
				</div>
			{:else}
				<img
					src="/images/products/thypoono/main.jpg"
					class="w-full h-auto object-contain dark:opacity-90 transition-opacity duration-300"
					class:opacity-0={!imageLoaded}
					class:opacity-100={imageLoaded}
					alt={m.keyboard_name()}
					onerror={handleImageError}
					onload={handleImageLoad}
				/>
			{/if}
		</div>

		<p
			class="max-w-2xl mx-auto text-xl text-foreground/80 dark:text-foreground/90 mt-8 px-4 text-center"
		>
			Ergonomic design meets refined craftsmanship.
		</p>
	</div>
</div>
