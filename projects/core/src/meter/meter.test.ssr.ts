// SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { html } from 'lit';
import { describe, expect, it } from 'vitest';
import { ssrRunner } from '@internals/vite';
import '@nvidia-elements/core/meter/define.js';

describe('nve-meter', () => {
  it('should render declarative shadow roots and preserve consumer semantics', async () => {
    const result =
      await ssrRunner.render(html`<nve-meter aria-label="Storage used" value="58" max="128" aria-valuetext="58 GB of 128 GB used"></nve-meter>
      <nve-meter aria-labelledby="meter-label" aria-describedby="meter-description" value="0"></nve-meter>
      <span id="meter-label">Memory</span><span id="meter-description">Memory allocation</span>
      <nve-meter aria-label="Temperature" min="-50" max="50" value="0" status="warning"></nve-meter>`);
    expect(result).toContain('shadowroot="open"');
    expect(result).toContain('nve-meter');
    expect(result).toContain('aria-label="Storage used"');
    expect(result).toContain('class="fill"');
  });
});
