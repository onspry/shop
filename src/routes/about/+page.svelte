<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { onMount } from 'svelte';

	// Content visibility control
	let contentVisible = $state(false);

	// Set timeout to prevent flash of content
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
	<div class="space-y-12">
		<div class="space-y-4">
			<h1 class="text-4xl font-medium">Our Story</h1>
			<div class="prose prose-lg dark:prose-invert max-w-none">
				<p class="text-xl text-muted-foreground leading-relaxed">
					Two European engineers, brought together by chance in China, united by a shared passion
					for open-source hardware and ergonomic design.
				</p>
			</div>
		</div>

		<div class="space-y-8">
			<h2 class="text-2xl font-medium">The Beginning</h2>
			<div class="prose prose-lg dark:prose-invert max-w-none space-y-6">
				<p>
					Our journey began when we found ourselves working in China, two Europeans far from home
					but surrounded by the world's most dynamic hardware ecosystem. As engineers with a deep
					appreciation for open-source projects, we were naturally drawn to foostan's Corne keyboard
					– an elegant solution to the challenges of ergonomic typing.
				</p>

				<p>
					The Corne keyboard represented everything we loved about open-source hardware: innovative
					design, community collaboration, and the potential for continuous improvement. We saw an
					opportunity not just to build these keyboards, but to elevate the entire project to new
					heights.
				</p>
			</div>
		</div>

		<div class="space-y-8">
			<h2 class="text-2xl font-medium">The Challenge</h2>
			<div class="prose prose-lg dark:prose-invert max-w-none space-y-6">
				<p>
					We set ourselves a challenge: to understand the complexities of producing custom keyboards
					at scale while maintaining the highest standards of quality. Being in China gave us unique
					access to manufacturing capabilities, but it also presented us with intricate challenges
					in sourcing, quality control, and logistics.
				</p>

				<p>
					What started as an exploration of feasibility quickly evolved into something more. We
					discovered that bringing an open-source hardware project to production-ready status
					required meticulous attention to detail, from PCB design modifications to sourcing the
					perfect components.
				</p>
			</div>
		</div>

		<div class="space-y-8">
			<h2 class="text-2xl font-medium">Looking Forward</h2>
			<div class="prose prose-lg dark:prose-invert max-w-none space-y-6">
				<p>
					This is just the beginning of our journey. Our experience has shown us that there's
					immense potential in bridging the gap between open-source hardware projects and
					professional manufacturing. We're excited to continue contributing to the mechanical
					keyboard community and pushing the boundaries of what's possible.
				</p>

				<p>
					We believe that great hardware should be both accessible and exceptional. By building upon
					foostan's excellent foundation, we hope to make the Corne keyboard experience available to
					more enthusiasts while maintaining the spirit of open-source collaboration that made it
					great in the first place.
				</p>
			</div>
		</div>

		<div class="flex justify-center pt-8">
			<Button variant="outline" onclick={() => window.history.back()}>Back</Button>
		</div>
	</div>
</div>
