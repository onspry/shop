<script lang="ts">
    import type { ProductViewModel } from '$lib/server/db/prisma/models/product';
    import ProductCard from '$lib/components/product-card.svelte';
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { Search } from 'lucide-svelte';
    import * as m from '$lib/paraglide/messages';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

    // Using $props() instead of export let for Svelte 5
    let { data } = $props<{
        data: {
            products: ProductViewModel[];
            total: number;
            query: string;
            page: number;
            pageSize: number;
        }
    }>();

    // Content visibility control
    let contentVisible = $state(false);
    let searchQuery = $state(data.query || '');

    // Set timeout to prevent flash of content
    onMount(() => {
        const timer = setTimeout(() => {
            contentVisible = true;
        }, 300);

        return () => clearTimeout(timer);
    });

    // Handle search form submission
    function handleSearch(event: Event) {
        event.preventDefault();
        if (searchQuery.trim()) {
            goto(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    }

    // Calculate pagination
    $effect(() => {
        totalPages = Math.ceil(data.total / data.pageSize) || 1;
        visiblePages = getVisiblePages(data.page, totalPages);
    });

    let totalPages = $state(Math.ceil(data.total / data.pageSize) || 1);
    let visiblePages = $state<number[]>([]);

    function getVisiblePages(currentPage: number, totalPages: number): number[] {
        const maxVisiblePages = 5;
        const pages: number[] = [];

        if (totalPages <= maxVisiblePages) {
            // Show all pages if there are fewer than maxVisiblePages
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            // Calculate start and end of visible pages
            let start = Math.max(2, currentPage - 1);
            let end = Math.min(totalPages - 1, currentPage + 1);

            // Adjust if we're at the beginning or end
            if (currentPage <= 2) {
                end = Math.min(totalPages - 1, 4);
            } else if (currentPage >= totalPages - 1) {
                start = Math.max(2, totalPages - 3);
            }

            // Add ellipsis after first page if needed
            if (start > 2) {
                pages.push(-1); // -1 represents ellipsis
            }

            // Add middle pages
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            // Add ellipsis before last page if needed
            if (end < totalPages - 1) {
                pages.push(-2); // -2 represents ellipsis
            }

            // Always show last page
            pages.push(totalPages);
        }

        return pages;
    }

    function goToPage(page: number) {
        if (page < 1 || page > totalPages) return;
        goto(`/search?q=${encodeURIComponent(data.query)}&page=${page}`);
    }
</script>

<div class="min-h-screen bg-background">
    <div
        class="container mx-auto px-4 py-8 transition-opacity duration-500"
        class:opacity-0={!contentVisible}
        class:opacity-100={contentVisible}
    >
        <h1 class="text-3xl font-bold mb-6">{m.search_results()}</h1>

        <!-- Search form -->
        <form on:submit={handleSearch} class="mb-8 flex gap-2">
            <Input
                type="search"
                placeholder={m.search_placeholder()}
                class="max-w-md"
                bind:value={searchQuery}
            />
            <Button type="submit">
                <Search class="h-4 w-4 mr-2" />
                {m.search()}
            </Button>
        </form>

        {#if data.query}
            <p class="mb-4">
                {#if data.total === 0}
                    {m.no_results_found({ query: data.query })}
                {:else if data.total === 1}
                    {m.one_result_found({ query: data.query })}
                {:else}
                    {m.results_found({ count: data.total, query: data.query })}
                {/if}
            </p>
        {/if}

        {#if data.products.length > 0}
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                {#each data.products as product (product.id)}
                    <ProductCard {product} />
                {/each}
            </div>

            <!-- Pagination -->
            {#if totalPages > 1}
                <div class="flex justify-center items-center gap-2 mt-8">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={data.page <= 1}
                        on:click={() => goToPage(data.page - 1)}
                    >
                        {m.previous()}
                    </Button>

                    {#each visiblePages as page}
                        {#if page < 0}
                            <span class="px-2">...</span>
                        {:else}
                            <Button
                                variant={page === data.page ? 'default' : 'outline'}
                                size="sm"
                                on:click={() => goToPage(page)}
                            >
                                {page}
                            </Button>
                        {/if}
                    {/each}

                    <Button
                        variant="outline"
                        size="sm"
                        disabled={data.page >= totalPages}
                        on:click={() => goToPage(data.page + 1)}
                    >
                        {m.next()}
                    </Button>
                </div>
            {/if}
        {:else if data.query}
            <div class="text-center py-12">
                <p class="text-xl mb-4">{m.no_products_found()}</p>
                <p class="text-muted-foreground mb-6">{m.try_different_search()}</p>
                <Button on:click={() => goto('/products')}>{m.browse_all_products()}</Button>
            </div>
        {:else}
            <div class="text-center py-12">
                <p class="text-xl mb-4">{m.search_for_products()}</p>
                <p class="text-muted-foreground">{m.enter_keywords()}</p>
            </div>
        {/if}
    </div>
</div>
