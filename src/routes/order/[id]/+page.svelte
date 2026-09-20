<script lang="ts">
	import SiteHeader from '$lib/components/store/SiteHeader.svelte';
	import SiteFooter from '$lib/components/store/SiteFooter.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import * as Table from '$lib/components/ui/table';
	import { Separator } from '$lib/components/ui/separator';
	import { CheckCircle2, Circle, Banknote } from '@lucide/svelte';
	import { formatMoney } from '$lib/money';

	let { data } = $props();
	const order = $derived(data.order);

	const STEPS = ['pending', 'confirmed', 'shipped', 'delivered'] as const;
	const stepIndex = $derived(
		order.status === 'cancelled' ? -1 : STEPS.indexOf(order.status as (typeof STEPS)[number])
	);

	const STATUS_LABELS: Record<string, string> = {
		pending: 'Pending',
		confirmed: 'Confirmed',
		shipped: 'Shipped',
		delivered: 'Delivered',
		cancelled: 'Cancelled'
	};
</script>

<svelte:head>
	<title>Order {order.publicId} — {data.brand}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<SiteHeader brand={data.brand} whatsapp={data.whatsapp} />

<main class="mx-auto max-w-2xl px-4 py-12">
	{#if data.placed}
		<div class="mb-8 rounded-xl border border-green-200 bg-green-50 p-5 text-center">
			<CheckCircle2 class="mx-auto mb-2 size-8 text-green-600" />
			<h1 class="font-display text-2xl font-semibold">Order placed</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				Thank you, {order.customerName}. We'll call {order.customerPhone} to confirm. Save this page to
				track your order.
			</p>
		</div>
	{:else}
		<h1 class="mb-2 font-display text-2xl font-semibold">Order {order.publicId}</h1>
	{/if}

	<div class="rounded-xl border border-stone-200 bg-card">
		<!-- Status tracker -->
		<div class="flex items-center justify-between gap-2 border-b border-stone-200 px-5 py-4">
			<div>
				<p class="text-sm text-muted-foreground">Status</p>
				<Badge variant={order.status === 'cancelled' ? 'destructive' : 'secondary'} class="mt-1">
					{STATUS_LABELS[order.status] ?? order.status}
				</Badge>
			</div>
			<div class="text-right">
				<p class="text-sm text-muted-foreground">Payment</p>
				<Badge variant="outline" class="mt-1 capitalize">{order.paymentStatus}</Badge>
			</div>
		</div>

		{#if order.status !== 'cancelled'}
			<div class="flex items-center px-5 py-5">
				{#each STEPS as step, i (step)}
					<div class="flex flex-1 items-center">
						<div class="flex flex-col items-center gap-1">
							{#if i <= stepIndex}
								<CheckCircle2 class="size-5 text-foreground" />
							{:else}
								<Circle class="size-5 text-stone-300" />
							{/if}
							<span
								class="text-[11px] capitalize {i <= stepIndex
									? 'text-foreground'
									: 'text-muted-foreground'}"
							>
								{STATUS_LABELS[step]}
							</span>
						</div>
						{#if i < STEPS.length - 1}
							<div
								class="mx-2 mb-4 h-px flex-1 {i < stepIndex ? 'bg-foreground' : 'bg-stone-200'}"
							></div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}

		<!-- Items -->
		<Table.Root>
			<Table.Body>
				{#each order.items as item (item.id)}
					<Table.Row>
						<Table.Cell class="min-w-36 text-sm whitespace-normal">
							{item.title}
							{#if item.variantName}
								<span class="text-muted-foreground">— {item.variantName}</span>
							{/if}
							<span class="text-muted-foreground"> × {item.quantity}</span>
						</Table.Cell>
						<Table.Cell class="text-right text-sm tabular-nums">
							{formatMoney(item.lineTotal, order.currency)}
						</Table.Cell>
					</Table.Row>
				{/each}
				<Table.Row>
					<Table.Cell class="min-w-36 text-sm whitespace-normal text-muted-foreground">
						Shipping — {order.shippingZoneName}
					</Table.Cell>
					<Table.Cell class="text-right text-sm tabular-nums">
						{formatMoney(order.shippingFee, order.currency)}
					</Table.Cell>
				</Table.Row>
			</Table.Body>
		</Table.Root>
		<Separator />
		<div class="flex items-center justify-between px-5 py-4">
			<span class="font-medium">Total</span>
			<span class="font-display text-xl font-semibold">
				{formatMoney(order.grandTotal, order.currency)}
			</span>
		</div>

		{#if order.paymentMethod === 'cod' && order.paymentStatus === 'unpaid'}
			<div class="mx-5 mb-5 flex items-start gap-3 rounded-lg bg-secondary/60 p-4">
				<Banknote class="mt-0.5 size-5 shrink-0" />
				<p class="text-sm text-muted-foreground">
					Cash on delivery — please keep {formatMoney(order.grandTotal, order.currency)}
					ready when your order arrives.
				</p>
			</div>
		{/if}
	</div>

	<div class="mt-6 rounded-xl border border-stone-200 bg-card p-5 text-sm">
		<p class="font-medium">Delivery to</p>
		<p class="mt-1 text-muted-foreground">{order.customerName}</p>
		<p class="text-muted-foreground">{order.customerAddress}</p>
		<p class="text-muted-foreground">{order.customerPhone}</p>
	</div>
</main>

<SiteFooter brand={data.brand} whatsapp={data.whatsapp} />
