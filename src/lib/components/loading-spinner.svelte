<script lang="ts">
	export let size = 24;
	export let stroke = 2;
</script>

<div
	class="animate-spin"
	style:width="{size}px"
	style:height="{size}px"
	role="status"
	aria-label="Loading"
>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width={stroke}
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<path d="M12 3a9 9 0 1 0 9 9" />
	</svg>
</div>
