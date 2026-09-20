<script lang="ts">
	import ProductForm from '$lib/components/admin/ProductForm.svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';
	import { Trash2, Wand2, ExternalLink } from '@lucide/svelte';
	import { formatMoney } from '$lib/money';
	import { resolve } from '$app/paths';

	let { data, form } = $props();
	const product = $derived(data.product);
	const colorOption = $derived(product.options.find((o) => /colou?r/i.test(o.name)));

	$effect(() => {
		if (form?.success) toast.success('Saved');
		if (form?.error) toast.error(String(form.error));
	});

	const saveAndRefresh =
		() =>
		async ({ update }: { update: () => Promise<void> }) => {
			await update();
			invalidateAll();
		};
</script>

<svelte:head><title>{product.title} — Products — Flare Admin</title></svelte:head>

<Breadcrumb.Root class="mb-6">
	<Breadcrumb.List>
		<Breadcrumb.Item>
			<Breadcrumb.Link href={resolve('/admin/(protected)/products')}>Products</Breadcrumb.Link>
		</Breadcrumb.Item>
		<Breadcrumb.Separator />
		<Breadcrumb.Item><Breadcrumb.Page>{product.title}</Breadcrumb.Page></Breadcrumb.Item>
	</Breadcrumb.List>
</Breadcrumb.Root>

<div class="mb-6 flex items-center justify-between">
	<h1 class="font-display text-2xl font-semibold">{product.title}</h1>
	{#if product.status === 'active'}
		<Button
			variant="outline"
			size="sm"
			href={resolve('/products/[slug]', { slug: product.slug })}
			target="_blank"
		>
			<ExternalLink class="size-4" /> View live
		</Button>
	{/if}
</div>

<div class="space-y-8">
	<ProductForm {product} {form} />

	<!-- Images -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="text-base">Images</Card.Title>
			<Card.Description>
				First image is the hero/thumbnail. Link images to a colourway for variant galleries.
			</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-5">
			<div class="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
				{#each product.images as image (image.id)}
					<figure class="group relative overflow-hidden rounded-lg border bg-stone-100">
						<img src={image.url} alt={image.alt} class="aspect-square w-full object-cover" />
						{#if image.colorKey}
							<Badge class="absolute top-2 left-2" variant="secondary">{image.colorKey}</Badge>
						{/if}
						<form
							method="POST"
							action="?/deleteImage"
							use:enhance={saveAndRefresh}
							class="absolute top-2 right-2 opacity-0 transition group-hover:opacity-100"
						>
							<input type="hidden" name="id" value={image.id} />
							<Button type="submit" variant="destructive" size="icon" class="size-7">
								<Trash2 class="size-3.5" />
							</Button>
						</form>
					</figure>
				{/each}
			</div>

			<form
				method="POST"
				action="?/uploadImage"
				enctype="multipart/form-data"
				use:enhance={saveAndRefresh}
				class="flex flex-wrap items-end gap-3 rounded-lg border border-dashed p-4"
			>
				<div class="min-w-48 flex-1 space-y-1.5">
					<Label for="image">Upload image</Label>
					<Input id="image" name="image" type="file" accept="image/*" required />
				</div>
				<div class="w-40 space-y-1.5">
					<Label for="alt">Alt text</Label>
					<Input id="alt" name="alt" value={product.title} />
				</div>
				{#if colorOption}
					<div class="w-36 space-y-1.5">
						<Label for="colorKey">{colorOption.name}</Label>
						<select
							id="colorKey"
							name="colorKey"
							class="h-9 w-full rounded-md border bg-background px-2 text-sm"
						>
							<option value="">—</option>
							{#each colorOption.values as color (color)}
								<option value={color}>{color}</option>
							{/each}
						</select>
					</div>
				{/if}
				<Button type="submit" variant="secondary">Upload</Button>
			</form>
		</Card.Content>
	</Card.Root>

	<!-- Variants -->
	<Card.Root>
		<Card.Header class="flex-row items-center justify-between space-y-0">
			<div>
				<Card.Title class="text-base">Variants</Card.Title>
				<Card.Description>
					Each row is a purchasable option combination. Blank stock = untracked.
				</Card.Description>
			</div>
			{#if product.options.length > 0}
				<form method="POST" action="?/generateVariants" use:enhance={saveAndRefresh}>
					<Button type="submit" variant="outline" size="sm">
						<Wand2 class="size-4" /> Generate from options
					</Button>
				</form>
			{/if}
		</Card.Header>
		<Card.Content class="space-y-4">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Name</Table.Head>
						<Table.Head>SKU</Table.Head>
						<Table.Head>Price override</Table.Head>
						<Table.Head>Stock</Table.Head>
						<Table.Head>Active</Table.Head>
						<Table.Head></Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each product.variants as variant (variant.id)}
						<Table.Row>
							<Table.Cell class="font-medium">
								{variant.name}
								{#if variant.priceOverride}
									<span class="ml-1 text-xs text-muted-foreground">
										({formatMoney(variant.priceOverride, product.currency)})
									</span>
								{/if}
							</Table.Cell>
							<Table.Cell colspan={4}>
								<form
									method="POST"
									action="?/updateVariant"
									use:enhance={saveAndRefresh}
									class="flex items-center gap-2"
								>
									<input type="hidden" name="id" value={variant.id} />
									<input type="hidden" name="active" value={variant.active} />
									<Input
										name="sku"
										value={variant.sku ?? ''}
										placeholder="SKU"
										class="h-8 w-28 text-xs"
									/>
									<Input
										name="priceOverride"
										type="number"
										step={0.01}
										min={0}
										value={variant.priceOverride ?? ''}
										placeholder={String(product.price)}
										class="h-8 w-24 text-xs"
									/>
									<Input
										name="stock"
										type="number"
										min={0}
										value={variant.stock ?? ''}
										placeholder="∞"
										class="h-8 w-20 text-xs"
									/>
									<Button type="submit" variant="secondary" size="sm" class="text-xs">Save</Button>
								</form>
							</Table.Cell>
							<Table.Cell>
								<div class="flex items-center gap-1">
									<form method="POST" action="?/toggleVariant" use:enhance={saveAndRefresh}>
										<input type="hidden" name="id" value={variant.id} />
										<Button type="submit" variant="ghost" size="sm" class="text-xs">
											{variant.active ? 'Deactivate' : 'Activate'}
										</Button>
									</form>
									<form method="POST" action="?/deleteVariant" use:enhance={saveAndRefresh}>
										<input type="hidden" name="id" value={variant.id} />
										<Button type="submit" variant="ghost" size="icon" class="size-7">
											<Trash2 class="size-3.5" />
										</Button>
									</form>
								</div>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>

			<Separator />

			<form
				method="POST"
				action="?/addVariant"
				use:enhance={saveAndRefresh}
				class="flex flex-wrap items-end gap-3"
			>
				<div class="w-48 space-y-1.5">
					<Label for="vname">Add variant</Label>
					<Input id="vname" name="name" placeholder="e.g. Black / 30" required />
				</div>
				<div class="w-28 space-y-1.5">
					<Label for="vsku">SKU</Label>
					<Input id="vsku" name="sku" />
				</div>
				<div class="w-28 space-y-1.5">
					<Label for="vprice">Price</Label>
					<Input id="vprice" name="priceOverride" type="number" step={0.01} min={0} />
				</div>
				<div class="w-24 space-y-1.5">
					<Label for="vstock">Stock</Label>
					<Input id="vstock" name="stock" type="number" min={0} />
				</div>
				<Button type="submit" variant="secondary">Add</Button>
			</form>
		</Card.Content>
	</Card.Root>

	<!-- Danger -->
	<Card.Root class="border-destructive/40">
		<Card.Content class="flex items-center justify-between p-5">
			<div>
				<p class="text-sm font-medium">Delete product</p>
				<p class="text-xs text-muted-foreground">
					Removes the product, its images and variants. Orders keep their snapshots.
				</p>
			</div>
			<form method="POST" action="?/delete" use:enhance>
				<Button type="submit" variant="destructive" size="sm">Delete</Button>
			</form>
		</Card.Content>
	</Card.Root>
</div>
