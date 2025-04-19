<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { AppImage } from '$lib/components/ui/app-image';
</script>

<div class="relative w-full overflow-hidden">
	<div class="flex flex-col items-center justify-center py-12 w-full">
		<h1 class="font-onest text-6xl font-light text-primary md:text-8xl mb-8">
			{m.keyboard_name()}
		</h1>

		<div class="w-full relative">
			<AppImage
				src="/images/products/thypoono/main.jpg"
				alt={m.keyboard_name()}
				width="100%"
				aspectRatio="16/9"
				className="w-full rounded-lg dark:opacity-90"
				objectFit="contain"
			/>
		</div>

		<p class="max-w-2xl text-xl text-foreground/80 dark:text-foreground/90 mt-8 text-center">
			Ergonomic design meets refined craftsmanship.
		</p>
	</div>
</div>
