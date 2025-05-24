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
		<!-- Left side: Logo + Mobile Menu -->
		<div class="flex items-center gap-4">
			<a href={localizeHref('/')} class="flex h-full items-center" aria-label={m.shop_title()}>
				<div class="logo" aria-label={m.shop_title()}></div>
			</a>

			<!-- Mobile hamburger -->
			<div class="md:hidden">
				<Sheet bind:open>
					<SheetTrigger>
						<div
							class="inline-flex h-10 w-10 items-center justify-center whitespace-nowrap rounded-md p-0 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
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
						<nav class="flex flex-col gap-6">
							<!-- Main Navigation -->
							<div class="flex flex-col gap-4">
								<h3 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
									Navigation
								</h3>
								<a
									href={localizeHref('/about')}
									class="py-2 text-base font-medium"
									onclick={() => (open = false)}>{m.navbar_about()}</a
								>
								<a
									href={localizeHref('/products')}
									class="py-2 text-base font-medium"
									onclick={() => (open = false)}>{m.navbar_products()}</a
								>
							</div>

							<!-- Settings -->
							<div class="flex flex-col gap-4 border-t pt-4">
								<h3 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
									Settings
								</h3>
								<div class="flex items-center justify-between py-2">
									<span class="text-base font-medium">Language</span>
									<LanguageSwitcher />
								</div>
								<div class="flex items-center justify-between py-2">
									<span class="text-base font-medium">Theme</span>
									<DarkmodeToggle />
								</div>
							</div>

							<!-- Account -->
							<div class="flex flex-col gap-4 border-t pt-4">
								<h3 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
									Account
								</h3>
								<div class="py-2">
									<AuthSection />
								</div>
							</div>
						</nav>
					</SheetContent>
				</Sheet>
			</div>
		</div>

		<!-- Center: Desktop Navigation -->
		<div class="hidden items-center gap-8 md:flex">
			<a
				href={localizeHref('/about')}
				class="text-sm font-medium transition-colors hover:text-primary">{m.navbar_about()}</a
			>
			<a
				href={localizeHref('/products')}
				class="text-sm font-medium transition-colors hover:text-primary">{m.navbar_products()}</a
			>
		</div>

		<!-- Right side: Cart (always visible) + Desktop Settings -->
		<div class="flex items-center gap-4">
			<!-- Cart always visible -->
			<CartIcon />

			<!-- Desktop-only settings -->
			<div class="hidden items-center gap-4 md:flex">
				<LanguageSwitcher />
				<DarkmodeToggle />
				<AuthSection />
			</div>
		</div>
	</div>
</nav>
