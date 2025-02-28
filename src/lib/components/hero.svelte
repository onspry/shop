<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
</script>

<div class="flex h-[600px] w-full flex-col items-center">
	<div class="flex flex-col items-center gap-12 pt-12">
		<div class="font-onest text-6xl font-light text-primary md:text-8xl">
			{m.keyboard_name()}
		</div>
		<div class="flex items-center justify-center">
			<img
				src="/board.jpeg"
				class="h-[400px] max-w-[1400px] object-contain opacity-20"
				alt={m.keyboard_name()}
			/>
		</div>
	</div>
</div>
