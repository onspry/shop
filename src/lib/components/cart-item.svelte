<script lang="ts">
	import type { CartItemViewModel } from '$lib/models/cart';
	import { X, Minus, Plus, ImageOff, Loader2 } from 'lucide-svelte';
	import { formatPrice } from '$lib/utils/price';
	import * as m from '$lib/paraglide/messages';
	import { Progress } from '$lib/components/ui/progress';
	import Button from './ui/button/button.svelte';

	let {
		item,
		onQuantityChange,
		onRemove,
		disabled = false
	} = $props<{
		item: CartItemViewModel;
		onQuantityChange: (quantity: number) => void;
		onRemove: () => void;
		disabled?: boolean;
	}>();

	let progress = $state(0);
	let progressInterval: ReturnType<typeof setInterval> | null = null;
	let showProgress = $state(false);
	let isAnimating = $state(false);
	let actionStartTime = $state<number | null>(null);
	let lastQuantity = $state(item?.quantity || 0);
	let lastTotalPrice = $state(0);

	// Calculate total price
	const totalPrice = $derived(item?.price * item?.quantity || 0);

	// Watch for quantity and price changes
	$effect(() => {
		if (isAnimating && (item?.quantity !== lastQuantity || totalPrice !== lastTotalPrice)) {
			// Clear the progress interval
			if (progressInterval) {
				clearInterval(progressInterval);
				progressInterval = null;
			}

			// Complete the animation
			progress = 100;
			setTimeout(() => {
				showProgress = false;
				isAnimating = false;
				actionStartTime = null;
			}, 300);
		}
		lastQuantity = item?.quantity || 0;
		lastTotalPrice = totalPrice;
	});

	// Start progress animation when an action is triggered
	function startProgressAnimation() {
		if (isAnimating) return;

		isAnimating = true;
		showProgress = true;
		progress = 0;
		actionStartTime = Date.now();

		if (progressInterval) {
			clearInterval(progressInterval);
		}

		progressInterval = setInterval(() => {
			const elapsed = Date.now() - (actionStartTime || 0);
			// Smooth continuous progress
			if (elapsed < 3000) {
				// First 3 seconds: Smooth progress to 85%
				progress = Math.min(85, (elapsed / 3000) * 85);
			}
		}, 16); // Update more frequently for smoother animation
	}

	// Quantity can't go below 1 or above available stock
	const minQuantity = 1;
	const maxQuantity = $derived(item?.variant?.stock_quantity || 1);
	const quantity = $derived(item?.quantity || 0);
	const price = $derived(item?.price || 0);
	const variantName = $derived(item?.variant?.name || 'Product');
	const variantImage = $derived(item?.variant?.attributes?.image);

	let imageError = $state(false);
	let imageLoaded = $state(false);

	function handleImageError() {
		imageError = true;
	}

	function handleImageLoad() {
		imageLoaded = true;
	}

	function incrementQuantity() {
		if (disabled || quantity >= maxQuantity) return;
		startProgressAnimation();
		onQuantityChange(quantity + 1);
	}

	function decrementQuantity() {
		if (disabled || quantity <= minQuantity) return;
		startProgressAnimation();
		onQuantityChange(quantity - 1);
	}

	function handleRemove() {
		if (disabled) return;
		startProgressAnimation();
		onRemove();
	}
</script>

<div class="relative">
	<div class="flex border rounded-lg overflow-hidden bg-background">
		<div class="w-32 h-32 flex-shrink-0">
			<div class="relative aspect-square h-full overflow-hidden">
				{#if imageError}
					<div class="absolute inset-0 flex items-center justify-center bg-muted">
						<ImageOff class="h-8 w-8 text-muted-foreground" />
					</div>
				{:else}
					{#if !imageLoaded}
						<div class="absolute inset-0">
							<div class="h-full w-full animate-pulse bg-muted-foreground/20"></div>
						</div>
					{/if}
					<img
						src={variantImage}
						alt={variantName}
						class="h-full w-full object-cover transition-opacity duration-300"
						class:opacity-0={!imageLoaded}
						class:opacity-100={imageLoaded}
						onerror={handleImageError}
						onload={handleImageLoad}
					/>
				{/if}
			</div>
		</div>

		<div class="flex-1 p-4 flex flex-col justify-between">
			<div class="flex justify-between">
				<div>
					<h3 class="font-medium text-sm sm:text-base">{variantName}</h3>
					<p class="text-muted-foreground text-xs sm:text-sm">{formatPrice(price)}</p>
				</div>
				<div class="flex items-start">
					<Button
						class="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
						variant="ghost"
						onclick={handleRemove}
						disabled={disabled || isAnimating}
						aria-label={m.cart_remove()}
					>
						<X class="h-5 w-5" />
					</Button>
				</div>
			</div>

			<div class="mt-4 flex justify-between items-center">
				<div class="flex items-center space-x-1">
					<Button
						class="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
						variant="ghost"
						onclick={decrementQuantity}
						disabled={disabled || isAnimating || quantity <= minQuantity}
						aria-label={m.cart_decrease_quantity()}
					>
						<Minus class="h-4 w-4" />
					</Button>

					<span class="w-8 text-center text-sm">{quantity}</span>

					<Button
						class="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
						variant="ghost"
						onclick={incrementQuantity}
						disabled={disabled || isAnimating || quantity >= maxQuantity}
						aria-label={m.cart_increase_quantity()}
					>
						<Plus class="h-4 w-4" />
					</Button>
				</div>

				<div class="text-right">
					<span class="font-medium">{formatPrice(price * quantity)}</span>
				</div>
			</div>
		</div>
	</div>
	{#if showProgress}
		<Progress value={progress} class="absolute bottom-0 left-0 right-0 h-1" />
	{/if}
</div>
