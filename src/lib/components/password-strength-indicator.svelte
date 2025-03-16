<script lang="ts">
	import {
		getPasswordStrength,
		getPasswordStrengthText,
		getPasswordStrengthColor
	} from '$lib/utils/password';

	// Using $props() for Svelte 5
	let { password } = $props<{ password: string }>();

	// Reactive calculations using Svelte 5 derived state
	const strength = $derived(getPasswordStrength(password || ''));
	const strengthText = $derived(getPasswordStrengthText(strength));
	const strengthColor = $derived(getPasswordStrengthColor(strength));
</script>

{#if password}
	<div class="mt-1">
		<div class="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
			<div
				class="h-full transition-all duration-300 {strengthColor}"
				style="width: {strength}%"
			></div>
		</div>
		<p class="text-xs mt-1 text-muted-foreground">
			{strengthText}
		</p>
	</div>
{/if}
