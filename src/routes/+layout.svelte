<script lang="ts">
	import { ModeWatcher } from 'mode-watcher';
	import { CookieBanner } from '$lib/components/ui/cookie-banner';
	import Footer from '$lib/components/footer.svelte';
	import './layout.css';

	let { children } = $props();
</script>

<ModeWatcher />
{@render children()}
<Footer />
<CookieBanner />
