<script lang="ts">
	import { ChevronsDown } from 'lucide-svelte/icons';
	import * as m from '$lib/paraglide/messages';
	import PriceDisplay from '$lib/components/price-display.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import ProductCard from '$lib/components/product-card.svelte';
	import type { ProductViewModel } from '$lib/models/product';
	import { localizeHref } from '$lib/paraglide/runtime';

	export let data: { products: ProductViewModel[] };
	let products = data.products;
</script>

<!-- Hero Section -->
<section
	class="flex flex-col items-center justify-center bg-white px-4 pb-6 pt-8 text-center dark:bg-neutral-950"
>
	<h1 class="mb-4 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl lg:text-6xl">
		Work Smarter.<br />Type Better.
	</h1>
	<p class="mx-auto mb-6 max-w-md text-lg text-foreground/80">
		Ergonomic, sustainable keyboards for creators and professionals. Designed for comfort, built for
		performance.
	</p>
	<a
		href={localizeHref('/products')}
		class="mb-6 inline-block rounded-full bg-primary px-8 py-3 text-lg font-semibold text-white shadow-lg transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50"
	>
		Shop Now
	</a>
	<img
		src="/images/products/thypoono/main.jpg"
		alt="Zero Keyboard"
		class="mb-4 h-auto w-full rounded-xl object-contain dark:shadow-lg lg:h-[480px] lg:max-w-[1280px]"
	/>

	<!-- Testimonial/Quote -->
	<section class="bg-background px-4 py-10 text-center">
		<blockquote class="mx-auto max-w-2xl text-xl font-medium italic text-foreground/80">
			"Switching to a split ergonomic keyboard drastically reduced the wrist and shoulder pain I
			experienced from years of heavy typing. While the transition had a learning curve, the
			long-term comfort and posture improvements made it absolutely worth it. I now type more
			mindfully and with significantly less strain."
			<footer class="mt-3 text-sm text-foreground/60">
				— Desmond KH Ip
				<a
					href="https://medium.com/@desmond-kh-ip/adopting-a-split-ergonomic-keyboard-to-reduce-keyboard-related-injuries-part-i-cf075e953dfe"
					target="_blank"
					rel="noopener noreferrer"
					class="ml-2 text-primary underline underline-offset-2 hover:text-primary/80"
					>Read his full story</a
				>
			</footer>
		</blockquote>
	</section>

	<!-- Value Propositions -->
	<section
		class="flex flex-col gap-8 bg-white px-4 py-12 dark:bg-neutral-950 md:flex-row md:justify-center md:gap-8"
	>
		<div
			class="group flex flex-1 flex-col items-center rounded-lg border border-border bg-white p-6 transition-all duration-200 hover:border-border/80 hover:shadow-md dark:bg-neutral-900"
		>
			<span class="i-lucide-armchair mb-2 text-3xl text-primary"></span>
			<h3 class="mb-1 text-lg font-bold text-neutral-900 dark:text-white">Ergonomic</h3>
			<p class="text-sm text-neutral-600 dark:text-neutral-300">
				Split, low-profile, and designed for all-day comfort.
			</p>
		</div>
		<div
			class="group flex flex-1 flex-col items-center rounded-lg border border-border bg-white p-6 transition-all duration-200 hover:border-border/80 hover:shadow-md dark:bg-neutral-900"
		>
			<span class="i-lucide-sliders-horizontal mb-2 text-3xl text-primary"></span>
			<h3 class="mb-1 text-lg font-bold text-neutral-900 dark:text-white">Customizable</h3>
			<p class="text-sm text-neutral-600 dark:text-neutral-300">
				Hot-swappable switches, layouts, and keycaps.
			</p>
		</div>
		<div
			class="group flex flex-1 flex-col items-center rounded-lg border border-border bg-white p-6 transition-all duration-200 hover:border-border/80 hover:shadow-md dark:bg-neutral-900"
		>
			<span class="i-lucide-leaf mb-2 text-3xl text-primary"></span>
			<h3 class="mb-1 text-lg font-bold text-neutral-900 dark:text-white">Sustainable</h3>
			<p class="text-sm text-neutral-600 dark:text-neutral-300">
				Eco-friendly materials and packaging.
			</p>
		</div>
	</section>

	<!-- Product Preview Carousel -->
	<section class="bg-white px-2 py-6 dark:bg-neutral-950">
		<h2 class="mb-4 text-center text-2xl font-bold text-neutral-900 dark:text-white">
			Featured Products
		</h2>
		<div class="flex snap-x gap-8 overflow-x-auto pb-2">
			{#if products.length === 0}
				{#each Array(4) as _}
					<div class="h-[350px] w-[300px] flex-shrink-0 snap-center p-2">
						<div
							class="group relative h-full w-full overflow-hidden rounded-lg border border-border bg-card"
						>
							<Skeleton class="h-full w-full animate-pulse rounded-lg bg-gray-200" />
						</div>
					</div>
				{/each}
			{:else}
				{#each products as product (product.id)}
					<div class="h-[350px] w-[300px] flex-shrink-0 snap-center p-2">
						<ProductCard {product} class="h-full w-full" />
					</div>
				{/each}
			{/if}
		</div>
	</section>
</section>

<!-- <div class="flex gap-4 p-8">
	{#each Array(4) as _}
		<div class="h-[350px] w-[300px] p-2">
			<div
				class="group relative h-full w-full overflow-hidden rounded-lg border border-border bg-card"
			>
				<Skeleton class="h-full w-full animate-pulse rounded-lg bg-muted" />
			</div>
		</div>
	{/each}
</div> -->

<style>
	/* Hide scrollbars for horizontal carousel on mobile */
	::-webkit-scrollbar {
		display: none;
	}
</style>
