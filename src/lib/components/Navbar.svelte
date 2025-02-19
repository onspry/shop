<script>
	import * as m from '$lib/paraglide/messages.js';
	// No reactive state is required for this simple nav component.
	// Text content uses localization keys (e.g., $t('nav_home')) for multilingual support.
</script>

<nav class="flex w-full items-center justify-between bg-transparent px-8 py-5 text-white">
	<div class="text-xl font-semibold tracking-tight text-[#f7df1e] hover:text-white">
		<a href="/" class="transition-colors duration-200">
			{m.shop_title()}
		</a>
	</div>
	<div class="flex items-center space-x-8">
		<a
			href="/"
			class="text-base font-medium text-gray-100 transition-colors duration-200 hover:text-[#f7df1e]"
		>
			{m.nav_home()}
		</a>
		<a
			href="/shop"
			class="text-base font-medium text-gray-100 transition-colors duration-200 hover:text-[#f7df1e]"
		>
			{m.nav_shop()}
		</a>
		<a
			href="/about"
			class="text-base font-medium text-gray-100 transition-colors duration-200 hover:text-[#f7df1e]"
		>
			{m.nav_about()}
		</a>
		<a
			href="/cart"
			class="text-base font-medium text-gray-100 transition-colors duration-200 hover:text-[#f7df1e]"
		>
			{m.nav_cart()}
		</a>
	</div>
</nav>
