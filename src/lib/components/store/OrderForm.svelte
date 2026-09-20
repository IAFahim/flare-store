<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import * as Table from '$lib/components/ui/table';
	import { Separator } from '$lib/components/ui/separator';
	import { Badge } from '$lib/components/ui/badge';
	import { Minus, Plus, Trash2 } from '@lucide/svelte';
	import { formatMoney } from '$lib/money';
	import type { ProductWithRelations } from '$lib/server/catalog';
	import type { ShippingZone } from '$lib/server/db/schema';
	import type { ActionData } from '../../../routes/$types';

	type PaymentMethod = { value: string; label: string; hint?: string };

	let {
		product,
		zones,
		paymentMethods,
		form,
		quantities = $bindable<Record<number, number>>({})
	}: {
		product: ProductWithRelations;
		zones: ShippingZone[];
		paymentMethods: PaymentMethod[];
		form: ActionData;
		quantities?: Record<number, number>;
	} = $props();

	const colorOption = $derived(product.options.find((o) => /colou?r/i.test(o.name)));
	const sizeOption = $derived(product.options.find((o) => o !== colorOption));
	const activeVariants = $derived(product.variants.filter((v) => v.active));

	function variantFor(color: string | null, size: string | null) {
		return activeVariants.find(
			(v) =>
				(!colorOption || v.options[colorOption.name] === color) &&
				(!sizeOption || v.options[sizeOption.name] === size)
		);
	}

	function optionImage(color: string) {
		return product.images.find((i) => i.colorKey === color) ?? product.images[0];
	}

	const inStock = (v: (typeof activeVariants)[number] | undefined | null) =>
		v != null && (v.stock === null || v.stock > 0);

	let selColor = $state<string | null>(colorOption?.values[0] ?? null);
	let selSize = $state<string | null>(sizeOption?.values[0] ?? null);
	let zoneId = $state<number | null>(zones[0]?.id ?? null);
	let paymentMethod = $state(paymentMethods[0]?.value ?? 'cod');
	let submitting = $state(false);

	const currentVariant = $derived(variantFor(selColor, selSize));
	const currentQty = $derived(currentVariant ? (quantities[currentVariant.id] ?? 0) : 0);

	function pickColor(color: string) {
		selColor = color;
		if (sizeOption && selSize && !variantFor(color, selSize)) {
			selSize = sizeOption.values.find((s) => variantFor(color, s)) ?? null;
		}
	}

	const selected = $derived(
		activeVariants
			.filter((v) => (quantities[v.id] ?? 0) > 0)
			.map((v) => ({
				variant: v,
				quantity: quantities[v.id],
				price: v.priceOverride ?? product.price
			}))
	);

	const itemsTotal = $derived(selected.reduce((s, l) => s + l.price * l.quantity, 0));
	const zone = $derived(zones.find((z) => z.id === zoneId) ?? null);
	const grandTotal = $derived(itemsTotal + (zone?.fee ?? 0));

	const itemsJson = $derived(
		JSON.stringify(selected.map((l) => ({ variantId: l.variant.id, quantity: l.quantity })))
	);

	function bump(id: number, delta: number, max?: number | null) {
		const next = Math.min(Math.max((quantities[id] ?? 0) + delta, 0), max ?? 20);
		quantities = { ...quantities, [id]: next };
	}
</script>

<form
	method="POST"
	use:enhance={() => {
		submitting = true;
		return async ({ update }) => {
			submitting = false;
			await update();
		};
	}}
	class="min-w-0 scroll-mt-20 space-y-8"
	id="order"
>
	<input type="hidden" name="items" value={itemsJson} />

	<!-- Variant picker -->
	<div class="space-y-4 rounded-xl border border-stone-200 bg-card p-4">
		<p class="font-medium">{product.title}</p>

		{#if colorOption}
			<div class="space-y-2">
				<p class="text-sm font-medium">
					{colorOption.name} — <span class="text-muted-foreground">{selColor}</span>
				</p>
				<div class="grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-2">
					{#each colorOption.values as color (color)}
						{@const img = optionImage(color)}
						{@const hasStock = activeVariants.some(
							(v) => v.options[colorOption.name] === color && inStock(v)
						)}
						<button
							type="button"
							onclick={() => pickColor(color)}
							disabled={!hasStock}
							class="flex min-w-0 touch-manipulation items-center justify-center gap-2 rounded-lg border px-2 py-2 text-sm transition {selColor ===
							color
								? 'border-foreground bg-secondary/50'
								: 'border-stone-200 hover:border-foreground/40'} disabled:opacity-40"
						>
							{#if img}
								<img
									src={img.url}
									alt={color}
									width="800"
									height="1000"
									class="size-8 shrink-0 rounded object-cover"
								/>
							{/if}
							<span class="truncate">{color}</span>
						</button>
					{/each}
				</div>
			</div>
		{/if}

		{#if sizeOption}
			<div class="space-y-2">
				<p class="text-sm font-medium">{sizeOption.name}</p>
				<div class="grid grid-cols-[repeat(auto-fill,minmax(3.5rem,1fr))] gap-2">
					{#each sizeOption.values as size (size)}
						{@const v = variantFor(selColor, size)}
						<button
							type="button"
							onclick={() => (selSize = size)}
							disabled={!inStock(v)}
							class="min-w-0 touch-manipulation rounded-lg border px-3 py-2 text-center text-sm font-medium transition {selSize ===
							size
								? 'border-foreground bg-foreground text-background'
								: 'border-stone-200 hover:border-foreground/40'} disabled:line-through disabled:opacity-40"
						>
							{size}
						</button>
					{/each}
				</div>
			</div>
		{/if}

		{#if currentVariant}
			{@const soldOut = !inStock(currentVariant)}
			<div class="flex items-center justify-between gap-3 border-t border-stone-200 pt-3">
				<div class="flex min-w-0 items-center gap-3">
					<div class="flex shrink-0 touch-manipulation items-center gap-1">
						<Button
							type="button"
							variant="outline"
							size="icon"
							class="size-8"
							disabled={currentQty <= 0}
							onclick={() => bump(currentVariant.id, -1)}
							aria-label="Decrease quantity"
						>
							<Minus class="size-3.5" />
						</Button>
						<input
							type="number"
							name="qty::{currentVariant.id}"
							min={0}
							max={currentVariant.stock ?? 20}
							inputmode="numeric"
							bind:value={
								() => currentQty,
								(v) => {
									const n = Math.min(Math.max(Number(v) || 0, 0), currentVariant.stock ?? 20);
									quantities = { ...quantities, [currentVariant.id]: n };
								}
							}
							class="w-12 [appearance:textfield] border-0 bg-transparent text-center text-sm tabular-nums focus-visible:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
						/>
						<Button
							type="button"
							variant="outline"
							size="icon"
							class="size-8"
							disabled={soldOut ||
								(currentVariant.stock !== null && currentQty >= currentVariant.stock)}
							onclick={() => bump(currentVariant.id, 1, currentVariant.stock)}
							aria-label="Increase quantity"
						>
							<Plus class="size-3.5" />
						</Button>
					</div>
					<span class="min-w-0 truncate text-sm text-muted-foreground">
						{currentVariant.name}
					</span>
				</div>
				<div class="shrink-0 text-right">
					<p class="text-sm font-medium tabular-nums">
						{formatMoney(currentVariant.priceOverride ?? product.price, product.currency)}
					</p>
					{#if currentVariant.stock !== null}
						<p class="text-xs text-muted-foreground">
							{soldOut ? 'Out of stock' : `${currentVariant.stock} in stock`}
						</p>
					{/if}
				</div>
			</div>
		{:else}
			<p class="border-t border-stone-200 pt-3 text-sm text-muted-foreground">
				That combination isn't available — pick another {sizeOption?.name ?? 'option'}.
			</p>
		{/if}
	</div>

	<!-- Selected items -->
	{#if selected.length > 0}
		<div class="space-y-2">
			<p class="text-sm font-medium">Your items</p>
			{#each selected as line (line.variant.id)}
				{@const img = colorOption
					? optionImage(line.variant.options[colorOption.name])
					: product.images[0]}
				<div class="flex items-center gap-3 rounded-lg border border-stone-200 bg-card p-3">
					{#if img}
						<img
							src={img.url}
							alt={line.variant.name}
							width="800"
							height="1000"
							class="size-12 shrink-0 rounded-lg object-cover"
						/>
					{/if}
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium">{line.variant.name}</p>
						<p class="text-xs text-muted-foreground tabular-nums">
							{formatMoney(line.price * line.quantity, product.currency)}
						</p>
					</div>
					<div class="flex shrink-0 touch-manipulation items-center gap-1">
						<Button
							type="button"
							variant="outline"
							size="icon"
							class="size-7"
							onclick={() => bump(line.variant.id, -1)}
							aria-label="Decrease quantity"
						>
							<Minus class="size-3.5" />
						</Button>
						<span class="w-8 text-center text-sm tabular-nums">{line.quantity}</span>
						<Button
							type="button"
							variant="outline"
							size="icon"
							class="size-7"
							disabled={line.variant.stock !== null && line.quantity >= line.variant.stock}
							onclick={() => bump(line.variant.id, 1, line.variant.stock)}
							aria-label="Increase quantity"
						>
							<Plus class="size-3.5" />
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							class="size-7 text-muted-foreground hover:text-destructive"
							onclick={() => (quantities = { ...quantities, [line.variant.id]: 0 })}
							aria-label="Remove item"
						>
							<Trash2 class="size-3.5" />
						</Button>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Billing details -->
	<fieldset class="min-w-0 space-y-4">
		<legend class="font-display text-lg font-semibold">Billing details</legend>
		<div class="grid gap-4 sm:grid-cols-2">
			<div class="space-y-1.5">
				<Label for="customerName"
					>নাম * <span class="text-xs text-muted-foreground">Name</span></Label
				>
				<Input
					id="customerName"
					name="customerName"
					autocomplete="name"
					required
					maxlength={120}
					placeholder="Your full name"
				/>
			</div>
			<div class="space-y-1.5">
				<Label for="customerPhone"
					>নাম্বার * <span class="text-xs text-muted-foreground">Phone</span></Label
				>
				<Input
					id="customerPhone"
					name="customerPhone"
					type="tel"
					autocomplete="tel"
					required
					maxlength={20}
					placeholder="01XXXXXXXXX"
				/>
			</div>
		</div>
		<div class="space-y-1.5">
			<Label for="customerAddress"
				>ঠিকানা * <span class="text-xs text-muted-foreground">Address</span></Label
			>
			<Textarea
				id="customerAddress"
				name="customerAddress"
				autocomplete="street-address"
				required
				maxlength={500}
				rows={2}
				placeholder="House, road, area, city"
			/>
		</div>
		<div class="space-y-1.5">
			<Label for="customerNote"
				>Order note <span class="text-xs text-muted-foreground">(optional)</span></Label
			>
			<Input
				id="customerNote"
				name="customerNote"
				maxlength={500}
				placeholder="Anything we should know?"
			/>
		</div>
	</fieldset>

	<!-- Shipping -->
	<fieldset class="min-w-0 space-y-3">
		<legend class="font-display text-lg font-semibold">Shipping</legend>
		<input type="hidden" name="shippingZoneId" value={zoneId ?? ''} />
		<RadioGroup.Root
			value={String(zoneId ?? '')}
			onValueChange={(v) => (zoneId = Number(v))}
			class="grid gap-2 sm:grid-cols-2"
		>
			{#each zones as z (z.id)}
				<Label
					class="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-stone-200 bg-card px-4 py-3 has-[:checked]:border-foreground/50 has-[:checked]:bg-secondary/40"
				>
					<span class="flex min-w-0 items-center gap-2 text-sm font-medium">
						<RadioGroup.Item value={String(z.id)} />
						<span class="min-w-0">{z.name}</span>
					</span>
					<span class="shrink-0 text-sm text-muted-foreground tabular-nums">
						{formatMoney(z.fee)}
					</span>
				</Label>
			{/each}
		</RadioGroup.Root>
	</fieldset>

	<!-- Payment -->
	<fieldset class="min-w-0 space-y-3">
		<legend class="font-display text-lg font-semibold">Payment</legend>
		<RadioGroup.Root bind:value={paymentMethod} name="paymentMethod" class="grid gap-2">
			{#each paymentMethods as method (method.value)}
				<Label
					class="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-stone-200 bg-card px-4 py-3 has-[:checked]:border-foreground/50 has-[:checked]:bg-secondary/40"
				>
					<span class="flex min-w-0 items-center gap-2 text-sm font-medium">
						<RadioGroup.Item value={method.value} />
						<span class="min-w-0">{method.label}</span>
					</span>
					{#if method.hint}
						<span class="shrink-0 text-xs text-muted-foreground">{method.hint}</span>
					{/if}
				</Label>
			{/each}
		</RadioGroup.Root>
	</fieldset>

	<!-- Summary -->
	<div class="rounded-xl border border-stone-200 bg-card">
		<div class="border-b border-stone-200 px-5 py-4">
			<h3 class="font-display text-lg font-semibold">Your order</h3>
		</div>
		<Table.Root>
			<Table.Body>
				{#each selected as line (line.variant.id)}
					<Table.Row>
						<Table.Cell class="min-w-36 text-sm whitespace-normal">
							{product.title}
							<span class="text-muted-foreground">— {line.variant.name}</span>
							<Badge variant="secondary" class="ml-2">× {line.quantity}</Badge>
						</Table.Cell>
						<Table.Cell class="text-right text-sm tabular-nums">
							{formatMoney(line.price * line.quantity, product.currency)}
						</Table.Cell>
					</Table.Row>
				{:else}
					<Table.Row>
						<Table.Cell colspan={2} class="py-6 text-center text-sm text-muted-foreground">
							Select at least one item above
						</Table.Cell>
					</Table.Row>
				{/each}
				<Table.Row>
					<Table.Cell class="min-w-36 text-sm whitespace-normal text-muted-foreground"
						>Shipping — {zone?.name ?? '—'}</Table.Cell
					>
					<Table.Cell class="text-right text-sm tabular-nums">
						{formatMoney(zone?.fee ?? 0)}
					</Table.Cell>
				</Table.Row>
			</Table.Body>
		</Table.Root>
		<Separator />
		<div class="flex items-center justify-between px-5 py-4">
			<span class="font-medium">Total</span>
			<span class="font-display text-xl font-semibold"
				>{formatMoney(grandTotal, product.currency)}</span
			>
		</div>
		<div class="px-5 pb-5">
			{#if form?.error}
				<p class="mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
					{form.error}
				</p>
			{/if}
			<Button type="submit" size="lg" class="w-full" disabled={selected.length === 0 || submitting}>
				{submitting
					? 'Placing order…'
					: `Place Order — ${formatMoney(grandTotal, product.currency)}`}
			</Button>
			<p class="mt-3 text-xs text-muted-foreground">
				By placing an order you agree to our terms. Your data is only used to process and deliver
				your order.
			</p>
		</div>
	</div>
</form>
