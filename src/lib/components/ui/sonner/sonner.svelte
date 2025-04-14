<script lang="ts">
	import { Toaster as Sonner, type ToasterProps } from 'svelte-sonner';
	import { mode } from 'mode-watcher';

	let { ...restProps }: ToasterProps = $props();
</script>

<Sonner
	theme={$mode}
	class="toaster group"
	toastOptions={{
		classes: {
			toast:
				'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
			description: 'group-[.toast]:text-muted-foreground',
			actionButton: 'group-[.toast]:bg-primary-foreground group-[.toast]:text-primary',
			cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
			success:
				'group-[.toaster]:bg-primary group-[.toaster]:text-primary-foreground group-[.toaster]:border-primary',
			error: 'group-[.toaster]:border-destructive',
			info: 'group-[.toaster]:border-primary/50',
			warning: 'group-[.toaster]:border-orange-500',
			loading: 'group-[.toaster]:border-muted'
		},

	}}
	{...restProps}
/>
