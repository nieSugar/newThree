import { describe, expect, it } from 'vitest';
import { highlightSource } from '../core/sourceHighlight';

describe('source highlighting', () => {
  it('wraps TypeScript and Three.js tokens with highlight classes', () => {
    const html = highlightSource(`const scene = new THREE.Scene();
// render once
renderer.render(scene, camera);`);

    expect(html).toContain('<span class="tok-keyword">const</span>');
    expect(html).toContain('<span class="tok-keyword">new</span>');
    expect(html).toContain('<span class="tok-namespace">THREE</span>');
    expect(html).toContain('<span class="tok-type">Scene</span>');
    expect(html).toContain('<span class="tok-function">render</span>');
    expect(html).toContain('<span class="tok-comment">// render once</span>');
  });

  it('escapes unsafe characters before returning HTML', () => {
    const html = highlightSource(`const tag = "<script>";`);

    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
  });
});
