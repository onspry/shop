<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { CheckCircle, ShoppingBag, ArrowRight } from 'lucide-svelte';
	import * as m from '$lib/paraglide/messages';
	import { userStore } from '$lib/stores/auth';

	// Get user status
	const user = $derived($userStore);
</script>

<div class="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
	<!-- Order Confirmation Header -->
	<div class="text-center mb-12">
		<div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
			<CheckCircle class="h-8 w-8 text-primary" />
		</div>
		<h1 class="text-3xl font-bold mb-2">{m.order_confirmation_thank_you()}</h1>
		<p class="text-xl text-muted-foreground mb-4">
			{m.order_confirmation_email_sent()}
		</p>
		
		<Card class="max-w-md mx-auto">
			<CardContent class="pt-6">
				<p class="mb-4">
					We've sent an email with your order details and confirmation number. 
					You'll receive updates about your order status via email.
				</p>
				
				{#if user}
					<p class="mb-4">
						You can also view your order details and track its status in your account.
					</p>
				{:else}
					<p class="mb-4">
						For future orders, consider creating an account to easily track your orders and manage your purchases.
					</p>
				{/if}
			</CardContent>
		</Card>
	</div>

	<!-- Action Buttons -->
	<div class="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
		{#if user}
			<Button variant="outline" href="/orders" class="flex items-center gap-2">
				{m.order_view_all()}
				<ArrowRight class="h-4 w-4" />
			</Button>
		{:else}
			<Button variant="outline" href="/auth/register" class="flex items-center gap-2">
				Create Account
				<ArrowRight class="h-4 w-4" />
			</Button>
		{/if}
		<Button href="/products" class="flex items-center gap-2">
			{m.order_continue_shopping()}
			<ShoppingBag class="h-4 w-4" />
		</Button>
	</div>
</div>
