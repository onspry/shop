<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { Button } from '$lib/components/ui/button';
	import type { User } from '$lib/server/db/schema';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger,
		DropdownMenuSeparator
	} from '$lib/components/ui/dropdown-menu';
	import { User as UserIcon, Settings, Package, LogOut } from 'lucide-svelte';

	export let user: User | null = null;
</script>

{#if user}
	<DropdownMenu>
		<DropdownMenuTrigger>
			<Avatar>
				<AvatarImage src={user.image ?? ''} alt={user.username ?? ''} />
				<AvatarFallback>{user.username?.[0]?.toUpperCase() ?? 'U'}</AvatarFallback>
			</Avatar>
		</DropdownMenuTrigger>
		<DropdownMenuContent align="end">
			<DropdownMenuItem href="/account">
				<UserIcon class="mr-2 h-4 w-4" />
				{m.my_account()}
			</DropdownMenuItem>
			<DropdownMenuItem href="/orders">
				<Package class="mr-2 h-4 w-4" />
				{m.my_orders()}
			</DropdownMenuItem>
			<DropdownMenuSeparator />
			<DropdownMenuItem href="/auth/logout" class="text-destructive">
				<LogOut class="mr-2 h-4 w-4" />
				{m.sign_out()}
			</DropdownMenuItem>
		</DropdownMenuContent>
	</DropdownMenu>
{:else}
	<Button href="/auth/login" variant="outline">
		{m.sign_in()}
	</Button>
{/if}
