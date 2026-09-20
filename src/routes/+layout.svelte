<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { Toaster } from '$lib/components/ui/sonner';
	import { ModeWatcher } from 'mode-watcher';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Flare Store</title>
</svelte:head>

<ModeWatcher defaultMode="light" />
<Toaster position="top-center" richColors />
{@render children()}
