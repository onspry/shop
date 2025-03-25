<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as m from '$lib/paraglide/messages';
	import { ArrowRight, CreditCard, Check } from 'lucide-svelte';
</script>

<div class="container mx-auto px-4 py-8">
	<h1 class="text-3xl font-bold mb-8">{m.checkout_tab_payment()}</h1>

	<div class="max-w-3xl mx-auto bg-muted/30 p-12 rounded-lg text-center">
		<p class="text-lg mb-6">
			This is a placeholder for the payment page. In a complete implementation, this would include:
		</p>

		<ul class="text-left space-y-2 mb-8 mx-auto max-w-md">
			<li>• Credit card information form</li>
			<li>• Payment method selection</li>
			<li>• Billing address confirmation</li>
			<li>• Order review and confirmation</li>
		</ul>

		<Button class="mt-4">
			<CreditCard class="mr-2" size={16} />
			Complete Order
		</Button>

		<div
			class="mt-16 p-6 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800"
		>
			<div class="flex items-center justify-center mb-4">
				<div class="bg-green-100 dark:bg-green-900 p-2 rounded-full">
					<Check class="text-green-600 dark:text-green-400" size={28} />
				</div>
			</div>
			<h2 class="text-xl font-medium mb-2">Implementation Note</h2>
			<p>
				For a real implementation, you would integrate with a payment processor like Stripe, PayPal,
				or similar services to handle secure payment processing.
			</p>
		</div>
	</div>
</div>
