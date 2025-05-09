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
				<h1 class="text-4xl font-medium">Privacy Policy</h1>
				<div class="prose prose-lg dark:prose-invert max-w-none">
					<p>
						This application collects your name, email address, and profile picture from Facebook
						when you log in using Facebook OAuth. This information is used solely to create and
						manage your account, personalize your experience, and enable e-commerce functionality.
					</p>
					<p>
						We do not share your personal information with third parties except as required to
						provide our services or comply with the law.
					</p>
					<p>
						You may request deletion of your account and associated data at any time by contacting
						us at <a href="mailto:support@onspry.com" class="underline hover:opacity-80 transition"
							>support@onspry.com</a
						>.
					</p>
					<p>For more information, please contact us at the email above.</p>
				</div>
			</div>
			<div class="flex justify-center pt-8">
				<Button variant="outline" onclick={() => window.history.back()}>Back</Button>
			</div>
		</div>
	</div>
</div>
