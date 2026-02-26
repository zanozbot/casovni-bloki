<script lang="ts">
	import { Arc, PieChart, Text } from 'layerchart';
	import * as Chart from '$lib/components/ui/chart';
	import { Button } from '$lib/components/ui/button';
	import { Calendar } from '$lib/components/ui/calendar';
	import * as Popover from '$lib/components/ui/popover';
	import * as Accordion from '$lib/components/ui/accordion';
	import { CalendarDate, type DateValue } from '@internationalized/date';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { getBlockForHour, getCurrentTimeBlock, isHighSeason } from '$lib/time-blocks';
	import { HOLYDAYS } from '$lib/holydays';
	import { isEasterMonday } from '$lib/easter';
	import { Label } from '$lib/components/ui/label';
	import { Github, RotateCcw } from '@lucide/svelte';
	import ThemeToggle from '$lib/components/theme-toggle.svelte';

	// Reactive state for selected date and time
	let selectedDate = $state(new Date());
	let popoverOpen = $state(false);

	// Convert JS Date to CalendarDate
	const dateToCalendarDate = (date: Date) => {
		return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
	};

	// Convert CalendarDate to JS Date (preserving time)
	const calendarDateToDate = (calendarDate: CalendarDate, currentDate: Date) => {
		const newDate = new Date(currentDate);
		newDate.setFullYear(calendarDate.year, calendarDate.month - 1, calendarDate.day);
		return newDate;
	};

	// Calendar value - derived from selectedDate
	let calendarValue = $derived(dateToCalendarDate(selectedDate));

	// Handle calendar date changes
	const handleCalendarChange = (value: DateValue | undefined) => {
		if (value && 'day' in value && 'month' in value && 'year' in value) {
			const calDate = new CalendarDate(value.year, value.month, value.day);
			selectedDate = calendarDateToDate(calDate, selectedDate);
			popoverOpen = false;
		}
	};

	// Navigate hours
	const goToPreviousHour = () => {
		const newDate = new Date(selectedDate);
		newDate.setHours(newDate.getHours() - 1);
		selectedDate = newDate;
	};

	const goToNextHour = () => {
		const newDate = new Date(selectedDate);
		newDate.setHours(newDate.getHours() + 1);
		selectedDate = newDate;
	};

	const goToNow = () => {
		selectedDate = new Date();
	};

	// Get day type information
	const dayTypeInfo = $derived.by(() => {
		const isWeekend = selectedDate.getDay() === 0 || selectedDate.getDay() === 6;
		const isHolyday = HOLYDAYS.some(
			(holyday) =>
				holyday.day === selectedDate.getDate() && holyday.month === selectedDate.getMonth()
		);
		const _isEasterMonday = selectedDate.getMonth() === 2 && isEasterMonday(selectedDate);

		const season = isHighSeason(selectedDate) ? 'Visoka' : 'Nizka';

		// Determine day type more specifically
		let dayType = 'Delavnik';
		if (isHolyday || _isEasterMonday) {
			dayType = 'Praznik';
		} else if (isWeekend) {
			dayType = 'Vikend';
		}

		// Calculate season end date
		const seasonEnd = isHighSeason(selectedDate)
			? new Date(selectedDate.getFullYear(), 1, 28) // Feb 28
			: new Date(selectedDate.getFullYear(), 9, 31); // Oct 31

		return { season, dayType, seasonEnd };
	});

	// Generate 24-hour chart data
	const chartData = $derived.by(() => {
		const currentHour = selectedDate.getHours();

		// Create data for each hour (0-23)
		return Array.from({ length: 24 }, (_, hour) => {
			const blockId = getBlockForHour(selectedDate, hour);

			return {
				hour,
				block: blockId,
				value: 1, // Equal size for each hour
				color: `var(--color-block${blockId})`,
				isCurrent: hour === currentHour
			};
		});
	});

	// Get current block info
	const currentBlockInfo = $derived.by(() => {
		const block = getCurrentTimeBlock(selectedDate);
		if (!block) return null;

		// Format end time
		let endTime = '';
		if (block.isOvernight) {
			endTime = `${String(block.end).padStart(2, '0')}:00 (naslednji dan)`;
		} else {
			endTime = `${String(block.end).padStart(2, '0')}:00`;
		}

		return {
			blockId: block.id,
			endTime
		};
	});

	// Get blocks appearing today
	const todayBlocksInfo = $derived.by(() => {
		const blocksSet = new Set<number>();
		for (let hour = 0; hour < 24; hour++) {
			const blockId = getBlockForHour(selectedDate, hour);
			blocksSet.add(blockId);
		}
		const blocks = Array.from(blocksSet).sort((a, b) => a - b);
		const minBlock = Math.min(...blocks);
		const maxBlock = Math.max(...blocks);

		return { blocks, minBlock, maxBlock };
	});

	// Get cheapest block start time
	const cheapestBlockInfo = $derived.by(() => {
		const { maxBlock } = todayBlocksInfo;
		// Find first occurrence of the highest block number (cheapest)
		for (let hour = 0; hour < 24; hour++) {
			const blockId = getBlockForHour(selectedDate, hour);
			if (blockId === maxBlock) {
				return {
					blockId: maxBlock,
					startTime: `${String(hour).padStart(2, '0')}.00 uri`
				};
			}
		}
		// This should never happen, but return first block as fallback
		return {
			blockId: maxBlock,
			startTime: '00.00 uri'
		};
	});

	// Chart configuration
	const chartConfig = {
		block1: { label: '1', color: 'var(--chart-1)' },
		block2: { label: '2', color: 'var(--chart-2)' },
		block3: { label: '3', color: 'var(--chart-3)' },
		block4: { label: '4', color: 'var(--chart-4)' },
		block5: { label: '5', color: 'var(--chart-5)' }
	} satisfies Chart.ChartConfig;

	// Helper to get angle for hour labels
	const getHourLabelPosition = (hour: number, isCurrent: boolean = false) => {
		// Start at top (12 o'clock) = -90 degrees
		// Each hour is 360/24 = 15 degrees
		const angle = (hour * 15 - 90) * (Math.PI / 180);
		const radius = isCurrent ? 165 : 155; // Larger offset for current hour
		return {
			x: Math.cos(angle) * radius,
			y: Math.sin(angle) * radius
		};
	};
</script>

<div class="container mx-auto max-w-3xl py-4 sm:px-4">
	<!-- Header -->
	<div class="space-y-1 px-4 text-center">
		<h1 class="text-3xl font-bold">Semafor časovnih blokov omrežnine</h1>
		<p class="text-lg text-muted-foreground">
			Preprosta vizualizacija časovnih blokov omrežnine glede na dan in uro.
		</p>
		<div>
			<ThemeToggle />
			<a href="https://github.com/zanozbot/casovni-bloki" target="_blank" rel="noopener noreferrer">
				<Button variant="outline" size="icon">
					<Github />
				</Button>
			</a>
		</div>
	</div>

	<div class="flex flex-col gap-4 sm:flex-row">
		<div class="flex-1">
			<Chart.Container config={chartConfig} class="mx-auto my-4 aspect-square h-85">
				<PieChart
					data={chartData}
					key="hour"
					value="value"
					c="color"
					innerRadius={100}
					outerRadius={130}
					padAngle={0.01}
					props={{
						pie: { motion: 'tween' },
						arc: {
							strokeWidth: 2,
							cornerRadius: 5
						}
					}}
				>
					{#snippet aboveMarks()}
						<!-- Center text content -->
						{#if currentBlockInfo}
							<!-- Block number -->
							<Text
								value={`Blok: ${currentBlockInfo.blockId}`}
								textAnchor="middle"
								verticalAnchor="middle"
								class="fill-foreground text-3xl! font-bold"
								dy={-10}
							/>
							<!-- End time -->
							<Text
								value={`do ${currentBlockInfo.endTime}`}
								textAnchor="middle"
								verticalAnchor="middle"
								class="fill-muted-foreground! text-base!"
								dy={15}
							/>
						{/if}

						<!-- Hour labels around the circle -->
						{#each Array.from({ length: 24 }) as _, hour}
							{@const currentHour = selectedDate.getHours()}
							{@const nextHour = (currentHour + 1) % 24}
							{@const isCurrent = chartData[hour]?.isCurrent}
							{@const needsOffset = hour === currentHour || hour === nextHour}
							{@const pos = getHourLabelPosition(hour, needsOffset)}
							<Text
								value={String(hour)}
								x={pos.x}
								y={pos.y}
								textAnchor="middle"
								verticalAnchor="middle"
								class="fill-muted-foreground text-sm! {needsOffset
									? 'fill-foreground! font-bold'
									: ''}"
							/>
						{/each}
					{/snippet}
					{#snippet arc({ props, index })}
						{@const arcProps = chartData[index].isCurrent ? { ...props, outerRadius: 145 } : props}
						<Arc {...arcProps} />
					{/snippet}
					{#snippet tooltip()}{/snippet}
				</PieChart>
			</Chart.Container>

			<div class="flex flex-col items-center justify-center gap-4">
				<!-- Calendar Date Picker -->
				<Popover.Root bind:open={popoverOpen}>
					<Popover.Trigger>
						{#snippet child({ props }: { props: Record<string, any> })}
							<Button {...props} variant="outline" class="justify-between font-normal">
								{selectedDate.toLocaleDateString('sl-SI', {
									weekday: 'long',
									year: 'numeric',
									month: 'short',
									day: 'numeric'
								})}
								<ChevronDownIcon />
							</Button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class="w-auto overflow-hidden p-0" align="start">
						<Calendar
							type="single"
							value={calendarValue}
							onValueChange={handleCalendarChange}
							locale="sl-SI"
							captionLayout="dropdown"
							minValue={new CalendarDate(2024, 10, 1)}
						/>
					</Popover.Content>
				</Popover.Root>

				<!-- Hour Controls -->
				<div class="flex items-center gap-2">
					<Button variant="outline" size="icon" onclick={goToPreviousHour}>
						<ChevronLeftIcon class="size-4" />
					</Button>
					<span class="w-16 text-center font-mono text-lg font-semibold">
						{String(selectedDate.getHours()).padStart(2, '0')}:00
					</span>
					<Button variant="outline" size="icon" onclick={goToNextHour}>
						<ChevronRightIcon class="size-4" />
					</Button>
				</div>

				<!-- Now Button -->
				<Button variant="default" onclick={goToNow}><RotateCcw class="size-4" /> Resetiraj</Button>
			</div>
		</div>
		<div class="mx-auto flex flex-col justify-center gap-4">
			<div class="space-y-1.5">
				<Label>Sezona</Label>
				<p class="text-lg">
					{dayTypeInfo.season} sezona traja do {dayTypeInfo.seasonEnd.toLocaleDateString('sl-SI', {
						day: 'numeric',
						month: 'numeric',
						year: 'numeric'
					})}
				</p>
			</div>

			<div class="space-y-1.5">
				<Label>Tip dneva</Label>
				<p class="text-lg">{dayTypeInfo.dayType}</p>
			</div>

			<div class="space-y-1.5">
				<Label>Bloki danes</Label>
				<p class="text-lg">Od {todayBlocksInfo.minBlock} do {todayBlocksInfo.maxBlock}</p>
			</div>

			<div class="space-y-1.5">
				<Label>Najcenejši blok</Label>
				<p class="text-lg">
					{cheapestBlockInfo.blockId}. blok se začne ob {cheapestBlockInfo.startTime}
				</p>
			</div>

			<div class="space-y-1.5">
				<Label>Legenda</Label>
				<div class="flex flex-wrap items-center gap-0.5">
					{#each Object.entries(chartConfig).reverse() as [key, { label, color }]}
						<div
							class="flex size-8 items-center justify-center rounded-sm font-medium text-white"
							style={`background-color: ${color}`}
						>
							{label}
						</div>
					{/each}
				</div>
				<div class="flex items-center gap-1 text-sm text-muted-foreground">
					<span>Najcenejši blok → Najdražji blok</span>
				</div>
			</div>
		</div>
	</div>

	<!-- FAQ Section -->
	<div class="mt-16 px-4">
		<h2 class="mb-4 text-center text-2xl font-bold">Pogosta vprašanja</h2>
		<Accordion.Root type="multiple" class="w-full">
			<Accordion.Item value="item-1">
				<Accordion.Trigger>Kaj so časovni bloki 1-5?</Accordion.Trigger>
				<Accordion.Content>
					<p class="mb-2">
						Časovni bloki so obdobja dneva, ki odražajo obremenjenost elektroenergetskega omrežja.
					</p>
					<p class="mb-1"><strong>Blok 1</strong> - največja obremenitev (najdražji)</p>
					<p class="mb-2"><strong>Blok 5</strong> - najmanjša obremenitev (najcenejši)</p>
					<p>Uporabljajo se izključno za obračun omrežnine, ne za ceno električne energije.</p>
				</Accordion.Content>
			</Accordion.Item>

			<Accordion.Item value="item-2">
				<Accordion.Trigger>Zakaj imajo dobavitelji še vedno VT in NT?</Accordion.Trigger>
				<Accordion.Content>
					<p class="mb-2">Ker:</p>
					<p class="mb-1"><strong>VT / NT</strong> = cena električne energije (blago)</p>
					<p class="mb-2"><strong>Bloki 1-5</strong> = omrežnina (uporaba omrežja)</p>
					<p>To sta dve ločeni stvari na istem računu.</p>
				</Accordion.Content>
			</Accordion.Item>

			<Accordion.Item value="item-3">
				<Accordion.Trigger>Kaj vse plačam na položnici?</Accordion.Trigger>
				<Accordion.Content>
					<p class="mb-2">Tri glavne sklope:</p>
					<ul class="list-inside list-disc space-y-1">
						<li>Električno energijo (kWh, VT/NT ali enotna tarifa)</li>
						<li>Omrežnino</li>
						<li>Davke in prispevke</li>
					</ul>
				</Accordion.Content>
			</Accordion.Item>

			<Accordion.Item value="item-4">
				<Accordion.Trigger>Iz česa je sestavljena omrežnina?</Accordion.Trigger>
				<Accordion.Content>
					<p class="mb-2">Omrežnina ima dva dela:</p>
					<p class="mb-2">
						<strong>Omrežnina za moč (kW)</strong><br />Plačilo za največjo 15-minutno moč, ki jo
						dosežeš v posameznem bloku.
					</p>
					<p>
						<strong>Omrežnina za energijo (kWh)</strong><br />Plačilo za količino energije, ki steče
						skozi omrežje, razdeljeno po blokih.
					</p>
				</Accordion.Content>
			</Accordion.Item>

			<Accordion.Item value="item-5">
				<Accordion.Trigger>Kaj pomeni priključna / dogovorjena moč (npr. 8 kW)?</Accordion.Trigger>
				<Accordion.Content>
					<p class="mb-2">To je največja moč, ki jo lahko hkrati uporabljaš.</p>
					<p>
						Tudi če imaš 8 kW priključka, se omrežnina za moč obračuna glede na dejansko dosežene
						konice, ne avtomatsko na 8 kW.
					</p>
				</Accordion.Content>
			</Accordion.Item>

			<Accordion.Item value="item-6">
				<Accordion.Trigger>Kako se meri moč?</Accordion.Trigger>
				<Accordion.Content>
					<p class="mb-2">Pametni števec meri:</p>
					<ul class="list-inside list-disc space-y-1">
						<li>povprečno moč v 15-minutnih intervalih</li>
						<li>za vsak blok posebej</li>
					</ul>
					<p class="mt-2">
						V mesecu se upošteva najvišja dosežena 15-minutna moč v posameznem bloku.
					</p>
				</Accordion.Content>
			</Accordion.Item>

			<Accordion.Item value="item-7">
				<Accordion.Trigger>Kaj je presežna (prekoračena) moč?</Accordion.Trigger>
				<Accordion.Content>
					<p class="mb-2">Presežna moč nastane, ko:</p>
					<p class="mb-2"><strong>izmerjena 15-minutna moč > dogovorjena moč</strong></p>
					<p>Če je ne presežeš, je presežek 0.</p>
				</Accordion.Content>
			</Accordion.Item>

			<Accordion.Item value="item-8">
				<Accordion.Trigger>Kako se izračuna presežek in strošek presežka?</Accordion.Trigger>
				<Accordion.Content>
					<p class="mb-2"><strong>Izračun presežka:</strong></p>
					<ol class="list-inside list-decimal space-y-1">
						<li>Zberejo se vse 15-minutne prekoračitve v mesecu</li>
						<li>Od vsake se odšteje dogovorjena moč</li>
						<li>Razlike se kvadrirajo, seštejejo in izračuna kvadratni koren</li>
					</ol>
					<p class="mt-2 mb-2">Rezultat je presežna obračunska moč (kW).</p>

					<p class="mt-4 mb-2"><strong>Izračun stroška presežka:</strong></p>
					<p class="mb-2">Strošek = faktor utežitve (0,9) x cena moči bloka x presežna moč</p>
					<p class="mb-2">Ni posebne kazenske tarife - uporablja se cena za moč v tistem bloku.</p>

					<p class="mt-2 text-sm text-muted-foreground">
						Več informacij:
						<a
							href="https://www.uro.si/prenova-omreznine/presezna-moc"
							target="_blank"
							rel="noopener noreferrer"
							class="text-primary underline hover:no-underline"
						>
							https://www.uro.si/prenova-omreznine/presezna-moc
						</a>
					</p>
				</Accordion.Content>
			</Accordion.Item>

			<Accordion.Item value="item-9">
				<Accordion.Trigger>Ali mi ob presežku izklopijo elektriko?</Accordion.Trigger>
				<Accordion.Content>
					<p class="mb-2"><strong>Ne.</strong></p>
					<p class="mb-2">Presežek se:</p>
					<ul class="list-inside list-disc space-y-1">
						<li>zabeleži</li>
						<li>finančno obračuna</li>
					</ul>
					<p class="mt-2">Izklop nastopi le ob fizičnih okvarah ali varovalkah.</p>
				</Accordion.Content>
			</Accordion.Item>

			<Accordion.Item value="item-10">
				<Accordion.Trigger>Kaj je pomembnejše za račun - kWh ali kW?</Accordion.Trigger>
				<Accordion.Content>
					<p class="mb-2">
						Za omrežnino pogosto <strong>bolj pomemben kW (konice)</strong> kot skupni kWh.
					</p>
					<p>Lahko imaš nizko porabo, pa visok račun zaradi velikih konic.</p>
				</Accordion.Content>
			</Accordion.Item>

			<Accordion.Item value="item-11">
				<Accordion.Trigger>Kako lahko znižam stroške?</Accordion.Trigger>
				<Accordion.Content>
					<ul class="list-inside space-y-1">
						<li>✔️ Ne uporabljaj več velikih porabnikov hkrati</li>
						<li>✔️ Prestavljaj porabo v nižje bloke (ponoči, vikendi)</li>
						<li>✔️ Uporabi časovnike za bojler, EV, TČ</li>
						<li>✔️ Spremljaj 15-minutne konice</li>
					</ul>
				</Accordion.Content>
			</Accordion.Item>

			<Accordion.Item value="item-12">
				<Accordion.Trigger>Kam spadajo gospodinjstva?</Accordion.Trigger>
				<Accordion.Content>
					<p>Gospodinjstva so v <strong>uporabniški skupini 0 (NN 230/400 V)</strong>.</p>
				</Accordion.Content>
			</Accordion.Item>

			<Accordion.Item value="item-13">
				<Accordion.Trigger>Kje lahko najdem cenik omrežnin?</Accordion.Trigger>
				<Accordion.Content>
					<p class="mb-2">Cenik omrežnin lahko najdete na spletni strani SODO:</p>
					<p class="mb-2">
						<a
							href="https://www.sodo.si/ceniki/2026-03-01/cenik-omreznin"
							target="_blank"
							rel="noopener noreferrer"
							class="text-primary underline hover:no-underline"
						>
							https://www.sodo.si/ceniki/2026-03-01/cenik-omreznin
						</a>
					</p>
					<p class="text-sm text-muted-foreground">
						Za gospodinjstva (uporabniška skupina 0) velja cenik omrežnin.
					</p>
				</Accordion.Content>
			</Accordion.Item>
		</Accordion.Root>
	</div>
</div>
