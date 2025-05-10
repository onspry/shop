<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import AuthSection from './auth-section.svelte';
	import DarkmodeToggle from './darkmode-toggle.svelte';
	import CartIcon from './cart-icon.svelte';
	import { Sheet, SheetTrigger, SheetContent } from '../components/ui/sheet';
	import Button from '../components/ui/button/button.svelte';
	let open = $state(false);
	// No reactive state is required for this simple nav component.
	// Text content uses localization keys (e.g., $t('nav_home')) for multilingual support.
</script>

<nav class="h-full w-full">
	<div class="flex h-full w-full items-center justify-between">
		<div class="flex items-center gap-8">
			<a href="/" class="flex h-full items-center" aria-label={m.shop_title()}>
				<div class="logo" aria-label={m.shop_title()}></div>
			</a>
			<!-- Desktop nav -->
			<div class="hidden md:flex items-center gap-6">
				<a href="/about" class="text-sm font-medium hover:text-primary transition-colors">About</a>
			</div>
			<div class="hidden md:flex items-center gap-6">
				<a href="/products" class="text-sm font-medium hover:text-primary transition-colors"
					>Products</a
				>
			</div>
			<!-- Mobile hamburger -->
			<div class="md:hidden">
				<Sheet bind:open>
					<SheetTrigger>
						<Button variant="ghost" size="icon" aria-label="Open menu">
							<svg
								width="24"
								height="24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" /></svg
							>
						</Button>
					</SheetTrigger>
					<SheetContent side="left" class="p-6">
						<nav class="flex flex-col gap-4">
							<a href="/about" class="text-base font-medium" onclick={() => (open = false)}>About</a
							>
							<a href="/products" class="text-base font-medium" onclick={() => (open = false)}
								>Products</a
							>
						</nav>
					</SheetContent>
				</Sheet>
			</div>
		</div>
		<div class="flex items-center gap-4">
			<CartIcon />
			<DarkmodeToggle />
			<AuthSection />
		</div>
	</div>
</nav>
