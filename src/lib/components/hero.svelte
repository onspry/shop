<script lang="ts">
	import { keyboard_name } from '$lib/paraglide/messages/_index.js';
	import { AppImage } from '$lib/components/ui/app-image';
	import * as m from '$lib/paraglide/messages';
	import { formatHeroContent } from '$lib/utils/hero-content';

	// Get formatted hero content
	const heroContent = $derived(
		formatHeroContent(m.hero_title(), m.hero_description(), m.hero_emphasis(), m.hero_tagline())
	);
</script>

<div class="relative w-full overflow-hidden">
	<div class="flex w-full flex-col items-center justify-center py-4">
		<!-- Header with mission statement and product name side by side -->
		<div class="mb-3 flex w-full flex-col items-center justify-between gap-2 md:flex-row md:gap-4">
			<!-- Mission statement on the left -->
			<div class="max-w-2xl px-4 md:w-1/2">
				<h2 class="mb-2 text-3xl font-light text-primary/90 md:text-4xl">{heroContent.title}</h2>
				<p class="text-xl font-light leading-relaxed text-foreground/80 md:text-2xl">
					{heroContent.description}
					<span class="mt-1 block font-medium text-primary">{heroContent.emphasis}</span>
				</p>
			</div>

			<!-- Product name on the right -->
			<div class="flex justify-center md:w-1/2 md:justify-center">
				<h1 class="font-onest text-5xl font-light text-primary md:pr-16 md:text-7xl">
					{keyboard_name()}
				</h1>
			</div>
		</div>

		<div class="relative mx-auto w-full lg:max-w-[1260px]">
			<AppImage
				src="/images/products/thypoono/main.jpg"
				alt={keyboard_name()}
				className="mx-auto w-full h-auto rounded-lg dark:opacity-90 lg:h-[480px] lg:max-w-[1260px]"
				objectFit="contain"
			/>
		</div>
	</div>
</div>
