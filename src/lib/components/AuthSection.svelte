<script lang="ts">
	import type { User } from '$lib/server/db/schema';
	import { clickOutside } from '$lib/actions/clickOutside';
	import { onNavigate } from '$app/navigation';

	export let user: User | null;
	let showDropdown = false;

	// Close dropdown on navigation
	onNavigate(() => {
		showDropdown = false;
	});
</script>

{#if user}
	<div class="relative">
		<button
			type="button"
			class="flex items-center gap-2"
			on:click={() => (showDropdown = !showDropdown)}
		>
			<div
				class="used-look flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-button)] text-sm font-bold text-gray-900"
			>
				{user.username[0].toUpperCase()}
			</div>
			<span class="text-[var(--color-text)]md:inline hidden text-sm">{user.username}</span>
		</button>

		{#if showDropdown}
			<div
				role="menu"
				tabindex="0"
				class="ring-opacity-5 absolute top-full right-0 z-[1001] mt-2 w-48 origin-top-right rounded-lg bg-gray-900/95 py-1 ring-1 shadow-lg ring-black backdrop-blur-sm transition-all"
				use:clickOutside={() => (showDropdown = false)}
				on:mouseleave={() => (showDropdown = false)}
			>
				<a
					href="/profile"
					class="text-[var(--color-text)]transition-colors block px-4 py-2 text-sm hover:bg-gray-800 hover:text-white"
				>
					Profile
				</a>
				<a
					href="/settings"
					class="text-[var(--color-text)]transition-colors block px-4 py-2 text-sm hover:bg-gray-800 hover:text-white"
				>
					Settings
				</a>
				<div class="my-1 border-t border-gray-800"></div>
				<a
					href="/auth/logout"
					class="block px-4 py-2 text-left text-sm text-red-400 transition-colors hover:bg-gray-800 hover:text-red-300"
				>
					Logout
				</a>
			</div>
		{/if}
	</div>
{:else}
	<a
		href="/auth/login"
		class="used-look rounded-lg bg-[var(--color-button)] px-4 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-[var(--color-button-hover)]"
	>
		Login
	</a>
{/if}
