<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
</script>

<div class="relative w-full overflow-hidden">
	<div class="flex flex-col items-center justify-center py-12 w-full">
		<h1 class="font-onest text-6xl font-light text-primary md:text-8xl mb-8">
			{m.keyboard_name()}
		</h1>

		<div class="w-full max-w-4xl mx-auto px-4">
			<img
				src="/board_grey.png"
				class="w-full h-auto object-contain dark:opacity-90"
				alt={m.keyboard_name()}
			/>
		</div>

		<p
			class="max-w-2xl mx-auto text-xl text-foreground/80 dark:text-foreground/90 mt-8 px-4 text-center"
		>
			Ergonomic design meets refined craftsmanship.
		</p>
	</div>
</div>
