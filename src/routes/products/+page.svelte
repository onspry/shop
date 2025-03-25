<script lang="ts">
	import type { CatalogueViewModel } from '$lib/models/catalogue';
	import ProductCard from '$lib/components/product-card.svelte';
	import { Button } from '$lib/components/ui/button';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { fade } from 'svelte/transition';
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';

	let { data } = $props<{ data: { catalogue: CatalogueViewModel } }>();

	// Calculate pagination - only run in browser
	const currentPage = $state(
		browser ? Number(new URL(window.location.href).searchParams.get('page')) || 1 : 1
	);
	const pageSize = $state(
		browser ? Number(new URL(window.location.href).searchParams.get('pageSize')) || 50 : 50
	);
	const totalPages = $derived(Math.ceil(data.catalogue.totalProducts / pageSize));

	// Handle page change
	function handlePageChange(page: number) {
		if (!browser) return;
		const url = new URL(window.location.href);
		url.searchParams.set('page', page.toString());
		goto(url.toString(), { replaceState: true });
	}
</script>

<div class="min-h-screen bg-background">
	<div class="container py-16 px-4 sm:px-6 lg:px-8">
		{#if !data.catalogue || data.catalogue.productGroups.length === 0}
			<div class="flex flex-col items-center justify-center py-16 text-muted-foreground">
				<div class="text-2xl font-medium mb-4">No products available</div>
				<p class="text-center">Check back later for new products</p>
			</div>
		{:else}
			{#each data.catalogue.productGroups as group}
				<section class="mb-24" transition:fade>
					<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
						<h2 class="text-4xl font-bold tracking-tight text-foreground mb-4 sm:mb-0">
							{group.category}
						</h2>
						<div class="h-1 w-24 bg-primary rounded-full hidden sm:block"></div>
					</div>

					<div
						class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
						in:fade={{ duration: 300, delay: 150 }}
					>
						{#each group.products as product (product.id)}
							<div class="transform transition-all duration-300 hover:scale-[1.02]">
								<ProductCard {product} />
							</div>
						{/each}
					</div>
				</section>
			{/each}

			<!-- Pagination -->
			{#if totalPages > 1}
				<div class="flex justify-center items-center gap-4 mt-16 mb-8">
					<Button
						variant="outline"
						class="flex items-center gap-2 px-6"
						disabled={currentPage === 1}
						onclick={() => handlePageChange(currentPage - 1)}
					>
						<ChevronLeft class="h-4 w-4" />
						Previous
					</Button>
					<div class="flex items-center gap-2 text-sm">
						<span class="px-3 py-1 rounded-md bg-muted">{currentPage}</span>
						<span class="text-muted-foreground">of</span>
						<span class="px-3 py-1 rounded-md bg-muted">{totalPages}</span>
					</div>
					<Button
						variant="outline"
						class="flex items-center gap-2 px-6"
						disabled={currentPage === totalPages}
						onclick={() => handlePageChange(currentPage + 1)}
					>
						Next
						<ChevronRight class="h-4 w-4" />
					</Button>
				</div>
			{/if}
		{/if}
	</div>
</div>
