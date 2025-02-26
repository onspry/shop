<script>
	import * as m from '$lib/paraglide/messages.js';
	// Compute the current year for the copyright text.
	const currentYear = new Date().getFullYear();
</script>

<footer>
	<p>© {currentYear} {m.footer_text()}</p>
</footer>
