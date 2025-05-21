<script lang="ts">
	export let product;
	import * as m from '$lib/paraglide/messages';
</script>

<div class="product-details">
	<h1 class="mb-2">{product.name}</h1>
	<p class="mb-4">{product.description}</p>

	{#if product.features && product.features.length > 0}
		<h2 class="mb-2 mt-4">{m.product_features()}</h2>
		<ul class="mb-4 list-inside list-disc">
			{#each product.features as feature}
				<li>{feature}</li>
			{/each}
		</ul>
	{/if}

	{#if product.specifications && Object.keys(product.specifications).length > 0}
		<h2 class="mb-2 mt-4">{m.product_specifications()}</h2>
		<table class="min-w-full border text-sm">
			<tbody>
				{#each Object.entries(product.specifications) as [key, value]}
					<tr>
						<td class="border px-2 py-1 font-medium">{key}</td>
						<td class="border px-2 py-1">{value}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>
