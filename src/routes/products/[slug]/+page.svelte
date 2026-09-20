<script lang="ts">
	import SiteHeader from '$lib/components/store/SiteHeader.svelte';
	import SiteFooter from '$lib/components/store/SiteFooter.svelte';
	import ProductGallery from '$lib/components/store/ProductGallery.svelte';
	import ProductDetail from '$lib/components/store/ProductDetail.svelte';
	import OrderForm from '$lib/components/store/OrderForm.svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import { resolve } from '$app/paths';

	let { data, form } = $props();
	const product = $derived(data.product);

	let quantities = $state<Record<number, number>>({});
	const cartCount = $derived(Object.values(quantities).reduce((s, q) => s + q, 0));
</script>

<svelte:head>
	<title>{product.title} — {data.brand}</title>
	<meta name="description" content={product.description.slice(0, 160)} />
</svelte:head>

<SiteHeader brand={data.brand} whatsapp={data.whatsapp} {cartCount} />

<main class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
	<Breadcrumb.Root class="mb-6">
		<Breadcrumb.List>
			<Breadcrumb.Item>
				<Breadcrumb.Link href={resolve('/')}>Home</Breadcrumb.Link>
			</Breadcrumb.Item>
			<Breadcrumb.Separator />
			<Breadcrumb.Item>
				<Breadcrumb.Page>{product.title}</Breadcrumb.Page>
			</Breadcrumb.Item>
		</Breadcrumb.List>
	</Breadcrumb.Root>

	<div class="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
		<div class="min-w-0 self-start lg:sticky lg:top-20">
			<ProductGallery images={product.images} title={product.title} />
		</div>
		<div class="min-w-0 space-y-10">
			<ProductDetail {product} />
			<OrderForm
				{product}
				zones={data.zones}
				paymentMethods={data.paymentMethods}
				{form}
				bind:quantities
			/>
		</div>
	</div>
</main>

<SiteFooter brand={data.brand} whatsapp={data.whatsapp} />
