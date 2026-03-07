export const getIntensityColor = (percentage: number) => {
    if (percentage === 0) return 'var(--color-bg-subtle)';
    if (percentage < 25) return 'rgba(249, 115, 22, 0.2)';
    if (percentage < 50) return 'rgba(249, 115, 22, 0.4)';
    if (percentage < 75) return 'rgba(249, 115, 22, 0.6)';
    if (percentage < 100) return 'rgba(249, 115, 22, 0.8)';
    return 'var(--color-primary)';
};