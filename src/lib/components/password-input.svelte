<script lang="ts">
	import { Eye, EyeOff } from 'lucide-svelte/icons';
	import { Button } from './ui/button';

	// Using $props() for Svelte 5 with oninput callback
	let { value, id, name, placeholder, autocomplete, ariaInvalid, disabled, oninput } = $props<{
		value: string;
		id: string;
		name: string;
		placeholder?: string;
		autocomplete?: string;
		ariaInvalid?: string;
		disabled?: boolean;
		oninput?: (value: string) => void;
	}>();

	// Handle input changes
	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		if (oninput) oninput(target.value);
	}

	// Toggle password visibility
	let showPassword = $state(false);
	const toggleVisibility = () => {
		showPassword = !showPassword;
	};
</script>

<div class="relative">
	<input
		{id}
		{name}
		type={showPassword ? 'text' : 'password'}
		{value}
		oninput={handleInput}
		{placeholder}
		{autocomplete}
		aria-invalid={ariaInvalid}
		{disabled}
		class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10"
	/>
	<Button
		type="button"
		class="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground"
		onclick={toggleVisibility}
		tabindex={-1}
		aria-label={showPassword ? 'Hide password' : 'Show password'}
	>
		{#if showPassword}
			<EyeOff class="h-4 w-4" />
		{:else}
			<Eye class="h-4 w-4" />
		{/if}
	</Button>
</div>
