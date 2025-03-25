<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as m from '$lib/paraglide/messages';
	import { ArrowRight } from 'lucide-svelte';
</script>

<div class="container mx-auto px-4 py-8">
	<h1 class="text-3xl font-bold mb-8">{m.checkout_tab_shipping()}</h1>

	<div class="max-w-3xl mx-auto bg-muted/30 p-12 rounded-lg text-center">
		<p class="text-lg mb-6">
			This is a placeholder for the shipping page. In a complete implementation, this would include:
		</p>

		<ul class="text-left space-y-2 mb-8 mx-auto max-w-md">
			<li>• Shipping address form</li>
			<li>• Shipping method selection</li>
			<li>• Address validation</li>
			<li>• Shipping cost calculation</li>
		</ul>

		<Button href="/checkout/payment" class="mt-4">
			{m.checkout_continue_to_payment()}
			<ArrowRight class="ml-2" size={16} />
		</Button>
	</div>
</div>
