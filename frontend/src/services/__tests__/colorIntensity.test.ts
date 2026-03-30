import { describe, it, expect } from 'vitest';
import { getIntensityColor, hexToRgb } from '../colorIntensity';

describe('hexToRgb', () => {
    it('converts a 6-digit hex with hash', () => {
        expect(hexToRgb('#f97316')).toBe('249, 115, 22');
    });

    it('converts a 6-digit hex without hash', () => {
        expect(hexToRgb('3b82f6')).toBe('59, 130, 246');
    });

    it('is case-insensitive', () => {
        expect(hexToRgb('#F97316')).toBe('249, 115, 22');
    });

    it('returns brand fallback for null', () => {
        expect(hexToRgb(null)).toBe('249, 115, 22');
    });

    it('returns brand fallback for undefined', () => {
        expect(hexToRgb(undefined)).toBe('249, 115, 22');
    });

    it('returns brand fallback for empty string', () => {
        expect(hexToRgb('')).toBe('249, 115, 22');
    });

    it('returns brand fallback for invalid hex', () => {
        expect(hexToRgb('not-a-color')).toBe('249, 115, 22');
    });
});

describe('getIntensityColor', () => {
    it('returns CSS variable at 0%', () => {
        expect(getIntensityColor(0)).toBe('var(--color-bg-subtle)');
    });

    it('returns 20% opacity below 25%', () => {
        expect(getIntensityColor(1)).toBe('rgba(249, 115, 22, 0.2)');
        expect(getIntensityColor(24)).toBe('rgba(249, 115, 22, 0.2)');
    });

    it('returns 40% opacity at 25% and below 50%', () => {
        expect(getIntensityColor(25)).toBe('rgba(249, 115, 22, 0.4)');
        expect(getIntensityColor(49)).toBe('rgba(249, 115, 22, 0.4)');
    });

    it('returns 60% opacity at 50% and below 75%', () => {
        expect(getIntensityColor(50)).toBe('rgba(249, 115, 22, 0.6)');
        expect(getIntensityColor(74)).toBe('rgba(249, 115, 22, 0.6)');
    });

    it('returns 80% opacity at 75% and below 100%', () => {
        expect(getIntensityColor(75)).toBe('rgba(249, 115, 22, 0.8)');
        expect(getIntensityColor(99)).toBe('rgba(249, 115, 22, 0.8)');
    });

    it('returns full opacity at 100%', () => {
        expect(getIntensityColor(100)).toBe('rgba(249, 115, 22, 1)');
    });

    it('uses custom arena color when provided', () => {
        expect(getIntensityColor(100, '59, 130, 246')).toBe('rgba(59, 130, 246, 1)');
        expect(getIntensityColor(50, '59, 130, 246')).toBe('rgba(59, 130, 246, 0.6)');
    });

    it('returns CSS variable at 0% regardless of custom color', () => {
        expect(getIntensityColor(0, '59, 130, 246')).toBe('var(--color-bg-subtle)');
    });
});
