<script lang="ts">
	const examples = [
		{
			title: 'Button Example',
			element: 'button',
			class: 'used-look bg-[var(--color-button)] px-6 py-3 rounded-lg font-bold'
		},
		{
			title: 'Text Example',
			element: 'h2',
			class: 'used-text text-4xl font-bold'
		},
		{
			title: 'Card Example',
			element: 'div',
			class: 'used-look bg-[var(--color-button)] p-8 rounded-xl'
		},
		{
			title: 'Badge Example',
			element: 'span',
			class: 'used-look bg-[var(--color-button)] px-4 py-2 rounded-full text-sm font-semibold'
		}
	];
</script>

<div class="container mx-auto px-4 py-12">
	<h1 class="used-text mb-12 text-center text-6xl font-bold">Visual Effects</h1>

	<!-- Wide Image Showcase -->
	<div class="relative mx-auto mb-24 w-full max-w-5xl">
		<img
			src="/board.jpeg"
			alt="Split Keyboard"
			class="border-glow relative h-[300px] w-[1500px] max-w-full rounded-lg object-cover transition-transform duration-700 hover:scale-[1.02]"
		/>
	</div>

	<div class="grid gap-12 md:grid-cols-2">
		{#each examples as example}
			<div class="space-y-4">
				<h3 class="text-xl font-semibold text-yellow-500">{example.title}</h3>
				<div
					class="flex min-h-[80px] w-full items-center justify-center rounded-lg bg-gray-900/50 p-6 backdrop-blur-sm"
				>
					{#if example.element === 'button'}
						<button class={example.class}>Click Me</button>
					{:else if example.element === 'h2'}
						<h2 class={example.class}>Sample Text</h2>
					{:else if example.element === 'div'}
						<div class={example.class}>
							<p class="text-gray-900">Card Content</p>
						</div>
					{:else}
						<span class={example.class}>Badge</span>
					{/if}
				</div>
				<pre class="overflow-x-auto rounded bg-gray-900/30 p-3 text-sm text-gray-300">
					<code>{example.class}</code>
				</pre>
			</div>
		{/each}
	</div>

	<!-- Interactive Demo -->
	<div class="mt-24">
		<h2 class="mb-8 text-center text-3xl font-bold text-yellow-500">Interactive Demo</h2>
		<div class="flex justify-center space-x-4">
			<button
				class="used-look rounded-lg bg-[var(--color-button)] px-6 py-3 font-bold transition-transform hover:scale-105"
			>
				Hover Me
			</button>
			<div
				class="used-look cursor-pointer rounded-lg bg-[var(--color-button)] px-6 py-3 font-bold transition-all hover:-translate-y-1"
			>
				Lift Effect
			</div>
		</div>
	</div>
</div>

<style>
	/* Additional hover effects can be added here if needed */
</style>
