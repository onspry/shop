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
	<div>
		<button on:mouseenter={() => (showDropdown = true)}>
			<span>{user.username}</span>
		</button>

		{#if showDropdown}
			<div
				role="menu"
				tabindex="0"
				use:clickOutside={() => (showDropdown = false)}
				on:mouseleave={() => {
					setTimeout(() => {
						showDropdown = false;
					}, 100);
				}}
			>
				<a href="/profile">Profile</a>
				<a href="/settings">Settings</a>
				<div></div>
				<a href="/auth/logout">Logout</a>
			</div>
		{/if}
	</div>
{:else}
	<a href="/auth/login">Login</a>
{/if}
