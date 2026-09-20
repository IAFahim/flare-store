<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Switch } from '$lib/components/ui/switch';
	import * as Select from '$lib/components/ui/select';
	import * as Card from '$lib/components/ui/card';
	import { PRODUCT_STATUSES } from '$lib/constants';
	import type { Product } from '$lib/server/db/schema';
	import { slugify } from '$lib/slug';

	let {
		product = null,
		form,
		action = '?/save'
	}: { product?: Product | null; form: unknown; action?: string } = $props();

	let title = $state(product?.title ?? '');
	let slug = $state(product?.slug ?? '');
	let slugTouched = $state(Boolean(product));
	let status = $state<string>(product?.status ?? 'draft');
	let featured = $state(product?.featured ?? false);

	$effect(() => {
		if (!slugTouched) slug = slugify(title);
	});

	const detailsJson = $derived(JSON.stringify(product?.details ?? [], null, 2));
	const optionsJson = $derived(JSON.stringify(product?.options ?? [], null, 2));
</script>

<form method="POST" {action} class="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
	<div class="min-w-0 space-y-6">
		<Card.Root>
			<Card.Header><Card.Title class="text-base">Product</Card.Title></Card.Header>
			<Card.Content class="space-y-4">
				<div class="space-y-1.5">
					<Label for="title">Title</Label>
					<Input id="title" name="title" bind:value={title} required maxlength={200} />
				</div>
				<div class="space-y-1.5">
					<Label for="slug">Slug</Label>
					<Input
						id="slug"
						name="slug"
						bind:value={slug}
						oninput={() => (slugTouched = true)}
						required
						maxlength={200}
					/>
					<p class="text-xs text-muted-foreground">/products/{slug || '…'}</p>
				</div>
				<div class="space-y-1.5">
					<Label for="subtitle">Subtitle / eyebrow</Label>
					<Input
						id="subtitle"
						name="subtitle"
						value={product?.subtitle ?? ''}
						maxlength={200}
						placeholder="Lounge · Est. comfort"
					/>
				</div>
				<div class="space-y-1.5">
					<Label for="description">Description</Label>
					<Textarea
						id="description"
						name="description"
						value={product?.description ?? ''}
						rows={6}
						placeholder="Paragraphs separated by blank lines"
					/>
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title class="text-base">Details & options (JSON)</Card.Title>
				<Card.Description>
					Details render as a spec table; options drive variant generation.
				</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="space-y-1.5">
					<Label for="details">Details</Label>
					<Textarea
						id="details"
						name="details"
						rows={6}
						value={detailsJson === '[]' ? '' : detailsJson}
						placeholder={'[{"label":"Fabric","value":"China Spandex Scuba, 220 GSM"}]'}
						class="font-mono text-xs"
					/>
				</div>
				<div class="space-y-1.5">
					<Label for="options">Options</Label>
					<Textarea
						id="options"
						name="options"
						rows={6}
						value={optionsJson === '[]' ? '' : optionsJson}
						placeholder={'[{"name":"Color","values":["Black","White"]},{"name":"Size","values":["30","32"]}]'}
						class="font-mono text-xs"
					/>
				</div>
			</Card.Content>
		</Card.Root>
	</div>

	<div class="min-w-0 space-y-6">
		<Card.Root>
			<Card.Header><Card.Title class="text-base">Pricing</Card.Title></Card.Header>
			<Card.Content class="space-y-4">
				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-1.5">
						<Label for="price">Price</Label>
						<Input
							id="price"
							name="price"
							type="number"
							step={0.01}
							min={0}
							value={product?.price ?? ''}
							required
						/>
					</div>
					<div class="space-y-1.5">
						<Label for="currency">Currency</Label>
						<Input id="currency" name="currency" value={product?.currency ?? 'BDT'} maxlength={8} />
					</div>
				</div>
				<div class="space-y-1.5">
					<Label for="compareAtPrice">Compare-at price (optional)</Label>
					<Input
						id="compareAtPrice"
						name="compareAtPrice"
						type="number"
						step={0.01}
						min={0}
						value={product?.compareAtPrice ?? ''}
					/>
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header><Card.Title class="text-base">Publishing</Card.Title></Card.Header>
			<Card.Content class="space-y-4">
				<div class="space-y-1.5">
					<Label for="status">Status</Label>
					<input type="hidden" name="status" value={status} />
					<Select.Root type="single" bind:value={status}>
						<Select.Trigger class="w-full capitalize">{status}</Select.Trigger>
						<Select.Content>
							{#each PRODUCT_STATUSES as s (s)}
								<Select.Item value={s} class="capitalize">{s}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
				<div class="flex items-center justify-between rounded-lg border px-4 py-3">
					<div>
						<p class="text-sm font-medium">Featured</p>
						<p class="text-xs text-muted-foreground">Show as the landing-page hero</p>
					</div>
					<input type="hidden" name="featured" value={featured} />
					<Switch bind:checked={featured} />
				</div>
				<div class="space-y-1.5">
					<Label for="position">Sort position</Label>
					<Input id="position" name="position" type="number" value={product?.position ?? 0} />
				</div>
			</Card.Content>
		</Card.Root>

		<Button type="submit" class="w-full" size="lg">
			{product ? 'Save changes' : 'Create product'}
		</Button>
		{#if form && typeof form === 'object' && 'error' in form && form.error}
			<p class="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
				{String(form.error)}
			</p>
		{/if}
	</div>
</form>
