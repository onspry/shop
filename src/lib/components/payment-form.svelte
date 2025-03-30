<script lang="ts">
	import * as m from '$lib/paraglide/messages';

	type PaymentEvent = {
		success: boolean;
		error?: string;
	};

	let { onPayment } = $props<{
		onPayment: (event: PaymentEvent) => void;
	}>();

	function handlePayment(success: boolean) {
		onPayment({
			success,
			error: success ? undefined : 'Payment failed: Transaction declined'
		});
	}
</script>

<div class="flex flex-col gap-4 items-center py-12">
	<p class="text-muted-foreground mb-4">{m.checkout_payment_placeholder()}</p>

	<div class="flex gap-4">
		<button
			class="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md"
			onclick={() => handlePayment(true)}
		>
			Simulate Successful Payment
		</button>
		<button
			class="bg-destructive text-destructive-foreground hover:bg-destructive/90 px-4 py-2 rounded-md"
			onclick={() => handlePayment(false)}
		>
			Simulate Failed Payment
		</button>
	</div>
</div>
