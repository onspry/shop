<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { userStore } from '$lib/stores/auth';
	import { Button } from '$lib/components/ui/button';
	import type { User } from '$lib/server/db/schema';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Avatar from '$lib/components/ui/avatar';
	import { User as UserIcon, Settings, Package, LogOut } from 'lucide-svelte';
</script>

<div class="relative">
	{#if $userStore}
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				<Avatar.Root>
					<Avatar.Image src={$userStore.image ?? ''} alt={$userStore.username ?? ''} />
					<Avatar.Fallback>{$userStore.username?.[0]?.toUpperCase() ?? 'U'}</Avatar.Fallback>
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
