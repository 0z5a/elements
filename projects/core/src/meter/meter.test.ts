// SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { html } from 'lit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createFixture, elementIsStable, removeFixture } from '@internals/testing';
import { Meter } from '@nvidia-elements/core/meter';
import '@nvidia-elements/core/meter/define.js';

describe(Meter.metadata.tag, () => {
  let fixture: HTMLElement;
  let meter: Meter;
  const fill = () => meter.shadowRoot!.querySelector<HTMLElement>('.fill')!;
  const track = () => meter.shadowRoot!.querySelector<HTMLElement>('[internal-host]')!;

  beforeEach(async () => {
    fixture = await createFixture(html`<nve-meter aria-label="Storage" style="width: 400px"></nve-meter>`);
    meter = fixture.querySelector('nve-meter')!;
    await elementIsStable(meter);
  });

  afterEach(() => removeFixture(fixture));

  it('should define a read-only meter with default bounds', () => {
    expect(customElements.get('nve-meter')).toBe(Meter);
    expect([meter.value, meter.min, meter.max]).toEqual([0, 0, 100]);
    expect(meter._internals.role).toBe('meter');
    expect(meter.tabIndex).toBe(-1);
    expect(fill().getBoundingClientRect().width).toBe(0);
  });

  it('should expose the same numeric scale that it paints', async () => {
    meter.setAttribute('value', '58');
    meter.max = 128;
    await elementIsStable(meter);
    expect(meter._internals.ariaValueNow).toBe('58');
    expect(meter._internals.ariaValueMin).toBe('0');
    expect(meter._internals.ariaValueMax).toBe('128');
    expect(fill().getBoundingClientRect().width).toBeCloseTo((400 * 58) / 128, 1);
    expect(meter.hasAttribute('max')).toBe(false);
  });

  it('should use the minimum as the fill origin', async () => {
    meter.min = 10;
    meter.max = 110;
    meter.value = 30;
    await elementIsStable(meter);
    expect(fill().getBoundingClientRect().width).toBeCloseTo(80);
    expect(meter._internals.ariaValueNow).toBe('30');
    expect(meter._internals.ariaValueMin).toBe('10');
  });

  it('should clamp accessible values without overwriting consumer properties', async () => {
    meter.min = 20;
    meter.max = 10;
    meter.value = 50;
    await elementIsStable(meter);
    expect([meter.value, meter.min, meter.max]).toEqual([50, 20, 10]);
    expect(meter._internals.ariaValueNow).toBe('20');
    expect(meter._internals.ariaValueMax).toBe('20');
    expect(fill().getBoundingClientRect().width).toBe(0);
  });

  it('should use finite defaults for malformed attributes', async () => {
    meter.setAttribute('value', 'invalid');
    meter.setAttribute('min', '-Infinity');
    meter.setAttribute('max', 'NaN');
    await elementIsStable(meter);
    expect(meter._internals.ariaValueNow).toBe('0');
    expect(meter._internals.ariaValueMin).toBe('0');
    expect(meter._internals.ariaValueMax).toBe('100');
  });

  it('should preserve consumer accessibility text without announcements or change events', async () => {
    const changed = vi.fn();
    meter.addEventListener('change', changed);
    meter.setAttribute('aria-valuetext', 'Storage nearly full');
    meter.setAttribute('aria-describedby', 'description');
    meter.status = 'warning';
    meter.value = 95;
    await elementIsStable(meter);
    expect(meter.getAttribute('aria-label')).toBe('Storage');
    expect(meter.getAttribute('aria-valuetext')).toBe('Storage nearly full');
    expect(meter.getAttribute('aria-describedby')).toBe('description');
    expect(meter._internals.role).toBe('meter');
    expect(meter._internals.ariaLive).toBeNull();
    expect(changed).not.toHaveBeenCalled();
  });

  it('should prioritize CSS overrides, then palette, then status, then default fill', async () => {
    meter.value = 50;
    await elementIsStable(meter);
    const defaultColor = getComputedStyle(fill()).backgroundColor;
    meter.status = 'danger';
    await elementIsStable(meter);
    const statusColor = getComputedStyle(fill()).backgroundColor;
    expect(statusColor).not.toBe(defaultColor);
    meter.color = 'blue-cobalt';
    await elementIsStable(meter);
    const paletteColor = getComputedStyle(fill()).backgroundColor;
    expect(paletteColor).not.toBe(statusColor);
    expect(meter.getAttribute('color')).toBe('blue-cobalt');
    expect(meter.getAttribute('status')).toBe('danger');
    meter.style.setProperty('--accent-color', 'rgb(90, 30, 120)');
    expect(getComputedStyle(fill()).backgroundColor).toBe('rgb(90, 30, 120)');
    meter.style.removeProperty('--accent-color');
    expect(getComputedStyle(fill()).backgroundColor).toBe(paletteColor);
    meter.color = undefined;
    await elementIsStable(meter);
    expect(getComputedStyle(fill()).backgroundColor).toBe(statusColor);
    meter.status = undefined;
    await elementIsStable(meter);
    expect(getComputedStyle(fill()).backgroundColor).toBe(defaultColor);
  });

  it('should support track customization and RTL fill direction', async () => {
    meter.style.setProperty('--height', '12px');
    meter.style.setProperty('--background', 'rgb(220, 220, 220)');
    meter.dir = 'rtl';
    meter.value = 25;
    await elementIsStable(meter);
    expect(track().getBoundingClientRect().height).toBe(12);
    expect(getComputedStyle(track()).backgroundColor).toBe('rgb(220, 220, 220)');
    expect(fill().getBoundingClientRect().right).toBe(track().getBoundingClientRect().right);
  });
});
