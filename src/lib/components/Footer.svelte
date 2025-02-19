<script>
	import * as m from '$lib/paraglide/messages.js';
	// Compute the current year for the copyright text.
	const currentYear = new Date().getFullYear();
</script>

<footer class="w-full border-t border-zinc-900 bg-transparent px-8 py-6 text-center">
	<p class="text-[13px] font-[450] tracking-wide text-gray-400 hover:text-gray-300">
		© {currentYear}
		{m.footer_text()}
	</p>
</footer>
