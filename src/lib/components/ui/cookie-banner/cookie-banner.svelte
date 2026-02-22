<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { onMount } from 'svelte';

	let visible = $state(false);

	onMount(() => {
		// Check if user has already accepted cookies
		const cookieConsent = localStorage.getItem('cookieConsent');
		if (!cookieConsent) {
			visible = true;
		}
	});

	const acceptCookies = () => {
		localStorage.setItem('cookieConsent', 'accepted');
		visible = false;
	};
</script>

{#if visible}
	<div
		class="fixed right-0 bottom-0 left-0 z-50 border-t bg-background/95 p-4 shadow-lg backdrop-blur"
	>
		<div
			class="container mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
		>
			<div class="flex-1">
				<p class="text-sm text-muted-foreground">
					Ta spletna stran uporablja piškotke za izboljšanje uporabniške izkušnje. Z nadaljevanjem
					uporabe se strinjate z njihovo uporabo.
				</p>
			</div>
			<div class="flex items-center">
				<Button size="sm" onclick={acceptCookies}>Sprejmi</Button>
			</div>
		</div>
	</div>
{/if}
