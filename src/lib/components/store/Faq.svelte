<script lang="ts">
	import * as Accordion from '$lib/components/ui/accordion';

	export type FaqItem = { question: string; answer: string };

	let { items, heading = 'Frequently asked' }: { items: FaqItem[]; heading?: string } = $props();
</script>

<section class="space-y-4">
	<h2 class="font-display text-2xl font-semibold">{heading}</h2>
	<Accordion.Root type="single" class="w-full">
		{#each items as item, i (i)}
			<Accordion.Item value="item-{i}">
				<Accordion.Trigger class="text-left text-sm font-medium">
					{item.question}
				</Accordion.Trigger>
				<Accordion.Content class="text-sm text-muted-foreground">
					{item.answer}
				</Accordion.Content>
			</Accordion.Item>
		{/each}
	</Accordion.Root>
</section>
