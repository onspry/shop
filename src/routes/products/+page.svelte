<script lang="ts">
	import type { CatalogueViewModel } from '$lib/models/catalogue';
	import ProductCard from '$lib/components/product-card.svelte';
	import { Button } from '$lib/components/ui/button';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';

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
	<div class="container py-12">
		{#if !data.catalogue || data.catalogue.productGroups.length === 0}
			<div class="text-center py-8">No products available</div>
		{:else}
			{#each data.catalogue.productGroups as group}
				<section class="mb-16">
					<h2 class="text-4xl font-bold tracking-tight text-foreground mb-8">
						{group.category}
					</h2>
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{#each group.products as product (product.id)}
							<ProductCard {product} />
						{/each}
					</div>
				</section>
			{/each}

			<!-- Pagination -->
			{#if totalPages > 1}
				<div class="flex justify-center gap-2 mt-8">
					<Button
						variant="outline"
						disabled={currentPage === 1}
						onclick={() => handlePageChange(currentPage - 1)}
					>
						Previous
					</Button>
					<span class="flex items-center px-4">
						Page {currentPage} of {totalPages}
					</span>
					<Button
						variant="outline"
						disabled={currentPage === totalPages}
						onclick={() => handlePageChange(currentPage + 1)}
					>
						Next
					</Button>
				</div>
			{/if}
		{/if}
	</div>
</div>
