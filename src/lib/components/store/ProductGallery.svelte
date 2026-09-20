<script lang="ts">
	import type { ProductImage } from '$lib/server/db/schema';
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';

	let {
		images,
		colorKey = null,
		title = '',
		autoplay = false,
		thumbnails = true
	}: {
		images: ProductImage[];
		colorKey?: string | null;
		title?: string;
		autoplay?: boolean;
		thumbnails?: boolean;
	} = $props();

	const filtered = $derived(
		colorKey && images.some((i) => i.colorKey === colorKey)
			? images.filter((i) => i.colorKey === colorKey || i.colorKey === null)
			: images
	);

	let active = $state(0);
	let paused = $state(false);
	const current = $derived(filtered[Math.min(active, filtered.length - 1)] ?? filtered[0]);

	const step = (dir: 1 | -1) => {
		active = (active + dir + filtered.length) % filtered.length;
	};

	$effect(() => {
		if (
			!autoplay ||
			paused ||
			filtered.length < 2 ||
			matchMedia('(prefers-reduced-motion: reduce)').matches
		) {
			return;
		}
		const t = setInterval(() => step(1), 4500);
		return () => clearInterval(t);
	});
</script>

<div
	class="space-y-3"
	role="group"
	aria-roledescription="carousel"
	aria-label="Product images"
	onmouseenter={() => (paused = true)}
	onmouseleave={() => (paused = false)}
	onfocusin={() => (paused = true)}
	onfocusout={() => (paused = false)}
>
	<div class="relative overflow-hidden rounded-xl bg-stone-100">
		{#if current}
			<img
				src={current.url}
				alt={current.alt || title}
				width="800"
				height="1000"
				class="aspect-[4/5] w-full object-cover"
				loading="eager"
				fetchpriority="high"
			/>
		{:else}
			<div class="flex aspect-[4/5] w-full items-center justify-center text-muted-foreground">
				No image
			</div>
		{/if}

		{#if filtered.length > 1}
			<button
				type="button"
				onclick={() => step(-1)}
				class="absolute top-1/2 left-2 flex size-9 -translate-y-1/2 touch-manipulation items-center justify-center rounded-full bg-background/80 shadow-sm backdrop-blur transition hover:bg-background"
				aria-label="Previous image"
			>
				<ChevronLeft class="size-5" />
			</button>
			<button
				type="button"
				onclick={() => step(1)}
				class="absolute top-1/2 right-2 flex size-9 -translate-y-1/2 touch-manipulation items-center justify-center rounded-full bg-background/80 shadow-sm backdrop-blur transition hover:bg-background"
				aria-label="Next image"
			>
				<ChevronRight class="size-5" />
			</button>
			<div class="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
				{#each filtered as image, i (image.id)}
					<button
						type="button"
						onclick={() => (active = i)}
						class="size-1.5 rounded-full transition {i === active
							? 'bg-foreground'
							: 'bg-foreground/30 hover:bg-foreground/50'}"
						aria-label="Go to image {i + 1}"
						aria-current={i === active}
					></button>
				{/each}
			</div>
		{/if}
	</div>

	{#if thumbnails && filtered.length > 1}
		<div class="grid grid-cols-4 gap-3">
			{#each filtered as image, i (image.id)}
				<button
					type="button"
					onclick={() => (active = i)}
					class="touch-manipulation overflow-hidden rounded-lg border-2 transition {i === active
						? 'border-foreground'
						: 'border-transparent opacity-70 hover:opacity-100'}"
					aria-label="View image {i + 1}"
					aria-current={i === active}
				>
					<img
						src={image.url}
						alt={image.alt || title}
						width="800"
						height="1000"
						class="aspect-square w-full object-cover"
						loading="lazy"
					/>
				</button>
			{/each}
		</div>
	{/if}
</div>
