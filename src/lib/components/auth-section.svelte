<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { userStore, authStore } from '$lib/stores/auth';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Avatar from '$lib/components/ui/avatar';
	import { User as UserIcon, Settings, Package, LogOut } from 'lucide-svelte/icons';
	import LoadingSpinner from '$lib/components/loading-spinner.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { afterNavigate } from '$app/navigation';

	// State variables using Svelte 5 runes
	let imageLoaded = $state(false);
	let imageError = $state(false);
	let currentPath = $state('/');

	// Update path after navigation
	afterNavigate(({ to }) => {
		currentPath = to?.url.pathname || '/';
	});

	// Reset loading state when image source changes
	$effect(() => {
		if ($authStore.user?.image) {
			imageLoaded = false;
			imageError = false;
		}
	});

	// Event handlers
	function handleImageLoad() {
		imageLoaded = true;
	}

	function handleImageError() {
		imageError = true;
		imageLoaded = true; // Consider it "loaded" even if it failed
	}

	// Get the current path for redirection
	const loginUrl = $derived(() => {
		return currentPath === '/' ? '/auth/login' : `/auth/login?redirect=${currentPath.slice(1)}`;
	});
</script>

<div class="relative inline-block">
	{#if $authStore.isLoading}
		<!-- Show a placeholder while loading -->
		<div class="h-10 w-10 flex items-center justify-center">
			<LoadingSpinner size={20} />
		</div>
	{:else if $authStore.user}
		<DropdownMenu.Root>
			<DropdownMenu.Trigger class="focus:outline-none focus-visible:ring-0">
				<Avatar.Root>
					{#if !imageLoaded}
						<Skeleton class="absolute inset-0 w-full h-full rounded-full z-10" />
					{/if}
					<Avatar.Image
						src={$authStore.user.image ?? ''}
						alt={$authStore.user.firstname ?? ''}
						onload={handleImageLoad}
						onerror={handleImageError}
						class={!imageLoaded ? 'opacity-0' : 'opacity-100'}
					/>
					{#if imageError || !$authStore.user.image}
						<Avatar.Fallback>
							{$authStore.user.firstname?.[0]?.toUpperCase() ?? 'U'}
						</Avatar.Fallback>
					{/if}
				</Avatar.Root>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content class="w-48">
				<DropdownMenu.Item>
					<a href="/account" class="flex items-center w-full">
						<UserIcon class="mr-2 h-4 w-4" />
						{m.my_account()}
					</a>
				</DropdownMenu.Item>
				<DropdownMenu.Item>
					<a href="/orders" class="flex items-center w-full">
						<Package class="mr-2 h-4 w-4" />
						{m.my_orders()}
					</a>
				</DropdownMenu.Item>
				<DropdownMenu.Separator />
				<DropdownMenu.Item>
					<a href="/auth/logout" class="flex items-center w-full text-destructive">
						<LogOut class="mr-2 h-4 w-4" />
						{m.sign_out()}
					</a>
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	{:else}
		<Button href={loginUrl()} variant="outline">
			{m.sign_in()}
		</Button>
	{/if}
</div>

<style>
	/* Override any focus styles from the dropdown menu trigger */
	:global(.dropdown-menu-trigger) {
		outline: none !important;
		box-shadow: none !important;
	}

	:global(.dropdown-menu-trigger:focus-visible) {
		outline: none !important;
		box-shadow: none !important;
	}
</style>
