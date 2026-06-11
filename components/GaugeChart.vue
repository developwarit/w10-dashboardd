<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import ReactSpeedometer, { Transition } from 'react-d3-speedometer';

const props = defineProps<{
  value: number;
  label: string;
}>();

const minValue = -3;
const maxValue = 3;
const segmentStops = [minValue, -1, 1, maxValue];
const segmentColors = ['#ef4444', '#facc15', '#22c55e'];
const gaugeElement = ref<HTMLElement | null>(null);
let root: Root | null = null;

const clampedValue = computed(() => Math.max(minValue, Math.min(maxValue, Number(props.value) || 0)));
const displayValue = computed(() => Number(props.value || 0).toFixed(2));

function renderGauge() {
  if (!gaugeElement.value) return;

  root ||= createRoot(gaugeElement.value);
  root.render(createElement(ReactSpeedometer, {
    minValue,
    maxValue,
    value: clampedValue.value,
    customSegmentStops: segmentStops,
    segmentColors,
    needleColor: '#0f172a',
    needleHeightRatio: 0.72,
    needleTransition: Transition.easeQuadOut,
    needleTransitionDuration: 450,
    ringWidth: 14,
    width: 118,
    height: 78,
    textColor: '#0f172a',
    labelFontSize: '9px',
    valueTextFontSize: '12px',
    valueTextFontWeight: '900',
    valueFormat: '.2f',
    currentValueText: '${value}',
    paddingHorizontal: 0,
    paddingVertical: 0,
    forceRender: true,
    svgAriaLabel: `${props.label} gauge ${displayValue.value}`,
  }));
}

onMounted(() => {
  nextTick(renderGauge);
});

watch(() => [props.value, props.label], () => {
  nextTick(renderGauge);
});

onBeforeUnmount(() => {
  root?.unmount();
  root = null;
});
</script>

<template>
  <div class="flex w-24 flex-col items-center">
    <div ref="gaugeElement" class="h-[78px] w-[118px]" />
    <p class="mt-1 w-full truncate text-center text-[10px] font-black text-slate-700">{{ label }}</p>
    <p class="text-sm font-black" :class="clampedValue < 0 ? 'text-red-600' : clampedValue > 0 ? 'text-emerald-700' : 'text-slate-900'">
      {{ displayValue }}
    </p>
  </div>
</template>
