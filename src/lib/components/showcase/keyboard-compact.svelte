<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
</script>

<div class="relative w-full overflow-hidden rounded-lg border border-border">
	<!-- Full-width background image with proper aspect ratio -->
	<div class="relative w-full aspect-[21/9]">
		<div class="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20"></div>

		<!-- Content positioned over the image -->
		<div class="absolute inset-0 flex flex-col items-center justify-center">
			<div class="text-center px-4">
				<h2 class="font-onest text-4xl font-light text-primary md:text-6xl mb-4">Compact Design</h2>
				<p class="max-w-2xl mx-auto text-lg text-foreground/80 dark:text-foreground/90">
					Space-saving layout without compromising on functionality
				</p>
				<div class="mt-6">
					<a
						href="#"
						class="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
					>
						Coming Soon
					</a>
				</div>
			</div>
		</div>
	</div>
</div>
