<script lang="ts">
	import { localizeHref } from '$lib/paraglide/runtime';
	import * as m from '$lib/paraglide/messages.js';

	import AuthSection from './auth-section.svelte';
	import DarkmodeToggle from './darkmode-toggle.svelte';
	import LanguageSwitcher from './language-switcher.svelte';
	import CartIcon from './cart-icon.svelte';
	import { Sheet, SheetTrigger, SheetContent } from '../components/ui/sheet';

	// Mobile menu state
	let open = $state(false);
</script>

<nav class="h-full w-full">
	<div class="flex h-full w-full items-center justify-between">
		<div class="flex items-center gap-8">
			<a href={localizeHref('/')} class="flex h-full items-center" aria-label={m.shop_title()}>
				<div class="logo" aria-label={m.shop_title()}></div>
			</a>
			<!-- Desktop nav -->
			<div class="hidden md:flex items-center gap-6">
				<a
					href={localizeHref('/about')}
					class="text-sm font-medium hover:text-primary transition-colors">{m.navbar_about()}</a
				>
			</div>
			<div class="hidden md:flex items-center gap-6">
				<a
					href={localizeHref('/products')}
					class="text-sm font-medium hover:text-primary transition-colors">{m.navbar_products()}</a
				>
			</div>
			<!-- Mobile hamburger -->
			<div class="md:hidden">
				<Sheet bind:open>
					<SheetTrigger>
						<div
							class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 w-10 p-0 hover:bg-accent hover:text-accent-foreground"
							aria-label={m.open_menu()}
						>
							<svg
								width="24"
								height="24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" /></svg
							>
						</div>
					</SheetTrigger>
					<SheetContent side="left" class="p-6">
						<nav class="flex flex-col gap-4">
							<a
								href={localizeHref('/about')}
								class="text-base font-medium"
								onclick={() => (open = false)}>{m.navbar_about()}</a
							>
							<a
								href={localizeHref('/products')}
								class="text-base font-medium"
								onclick={() => (open = false)}>{m.navbar_products()}</a
							>

							<!-- Mobile language switcher placeholder -->
							<div class="mt-4 pt-4 border-t border-border">
								<p class="text-sm text-muted-foreground mb-2">{m.navbar_language()}</p>
								<LanguageSwitcher isMobile={true} />
							</div>
						</nav>
					</SheetContent>
				</Sheet>
			</div>
		</div>
		<div class="flex items-center gap-4">
			<CartIcon />
			<LanguageSwitcher />
			<DarkmodeToggle />
			<AuthSection />
		</div>
	</div>
</nav>
