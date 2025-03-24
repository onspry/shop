<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { userStore, authStore } from '$lib/stores/auth';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Avatar from '$lib/components/ui/avatar';
	import { User as UserIcon, Settings, Package, LogOut } from 'lucide-svelte';
	import LoadingSpinner from '$lib/components/loading-spinner.svelte';
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
					<Avatar.Image src={$authStore.user.image ?? ''} alt={$authStore.user.firstname ?? ''} />
					<Avatar.Fallback>{$authStore.user.firstname?.[0]?.toUpperCase() ?? 'U'}</Avatar.Fallback>
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
		<Button href="/auth/login" variant="outline">
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
