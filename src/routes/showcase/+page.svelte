<script lang="ts">
	import KeyboardSplit from '$lib/components/showcase/keyboard-split.svelte';
	import KeyboardCompact from '$lib/components/showcase/keyboard-compact.svelte';
	import { Button } from '$lib/components/ui/button';
</script>

<div class="w-full space-y-12">
	<div class="space-y-4">
		<h1 class="text-4xl font-bold">Product Showcase</h1>
		<p class="text-muted-foreground text-lg">
			Explore our collection of premium ergonomic keyboards designed for comfort and productivity.
		</p>
	</div>

	<div class="grid grid-cols-1 gap-12">
		<div class="space-y-4">
			<h2 class="text-2xl font-semibold">Split Keyboard Design</h2>
			<p class="text-muted-foreground">
				Our flagship split keyboard design offers unparalleled ergonomic benefits for extended
				typing sessions.
			</p>
			<KeyboardSplit />
		</div>

		<div class="space-y-4">
			<h2 class="text-2xl font-semibold">Compact Keyboard</h2>
			<p class="text-muted-foreground">
				For those who prefer a more traditional layout with the same premium build quality.
			</p>
			<KeyboardCompact />
		</div>
	</div>

	<div class="flex justify-center pt-8">
		<Button variant="outline" onclick={() => window.history.back()}>Back to Home</Button>
	</div>
</div>
