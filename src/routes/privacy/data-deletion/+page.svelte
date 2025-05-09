<script lang="ts">
	import { onMount } from 'svelte';
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
				<h1 class="text-4xl font-medium">Facebook Data Deletion Instructions</h1>
				<div class="prose prose-lg dark:prose-invert max-w-none">
					<p>
						If you wish to delete your data collected via Facebook Login, please email us at
						<a href="mailto:support@onspry.com">support@onspry.com</a>
						with the subject "Facebook Data Deletion Request" and include your account email address.
					</p>
					<p>We will process your request and delete your data from our systems within 30 days.</p>
				</div>
			</div>
		</div>
	</div>
</div>
