<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	let contentVisible = $state(false);
	onMount(() => {
		const timer = setTimeout(() => {
			contentVisible = true;
		}, 300);
		return () => clearTimeout(timer);
	});
</script>

<div
	class="transition-opacity duration-500"
	class:opacity-0={!contentVisible}
	class:opacity-100={contentVisible}
>
	<div class="text-only">
		<div class="space-y-12">
			<div class="space-y-4">
				<h1 class="text-4xl font-medium">Terms of Service</h1>
				<div class="prose prose-lg dark:prose-invert max-w-none">
					<p>
						Welcome to Onspry! By using our website and services, you agree to the following terms
						and conditions. Please read them carefully.
					</p>
				</div>
			</div>
			<div class="space-y-8">
				<h2 class="text-2xl font-medium">1. User Accounts</h2>
				<div class="prose prose-lg dark:prose-invert max-w-none">
					<p>
						You are responsible for maintaining the confidentiality of your account credentials and
						for all activities that occur under your account. You agree to provide accurate and
						complete information when creating an account.
					</p>
				</div>
			</div>
			<div class="space-y-8">
				<h2 class="text-2xl font-medium">2. Privacy</h2>
				<div class="prose prose-lg dark:prose-invert max-w-none">
					<p>
						Your privacy is important to us. Please review our
						<a href="/privacy" class="underline hover:opacity-80 transition">Privacy Policy</a>
						to understand how we collect, use, and protect your information.
					</p>
				</div>
			</div>
			<div class="space-y-8">
				<h2 class="text-2xl font-medium">3. Acceptable Use</h2>
				<div class="prose prose-lg dark:prose-invert max-w-none">
					<p>
						You agree not to use our services for any unlawful or prohibited activities, including
						but not limited to fraud, abuse, or violation of any applicable laws or regulations.
					</p>
				</div>
			</div>
			<div class="space-y-8">
				<h2 class="text-2xl font-medium">4. Orders and Payments</h2>
				<div class="prose prose-lg dark:prose-invert max-w-none">
					<p>
						All orders are subject to acceptance and availability. We reserve the right to refuse or
						cancel any order at our discretion. Payment information must be valid and authorized for
						all purchases.
					</p>
				</div>
			</div>
			<div class="space-y-8">
				<h2 class="text-2xl font-medium">5. Limitation of Liability</h2>
				<div class="prose prose-lg dark:prose-invert max-w-none">
					<p>
						Onspry is not liable for any indirect, incidental, or consequential damages arising from
						your use of our services. Our total liability is limited to the amount paid by you for
						the products or services in question.
					</p>
				</div>
			</div>
			<div class="space-y-8">
				<h2 class="text-2xl font-medium">6. Changes to Terms</h2>
				<div class="prose prose-lg dark:prose-invert max-w-none">
					<p>
						We may update these Terms of Service from time to time. Continued use of our services
						constitutes acceptance of the revised terms.
					</p>
				</div>
			</div>
			<div class="space-y-8">
				<h2 class="text-2xl font-medium">7. Contact</h2>
				<div class="prose prose-lg dark:prose-invert max-w-none">
					<p>
						If you have any questions about these terms, please contact us at
						<a href="mailto:support@onspry.com" class="underline hover:opacity-80 transition"
							>support@onspry.com</a
						>.
					</p>
				</div>
			</div>
			<div class="flex justify-center pt-8">
				<Button variant="outline" onclick={() => window.history.back()}>Back</Button>
			</div>
		</div>
	</div>
</div>
