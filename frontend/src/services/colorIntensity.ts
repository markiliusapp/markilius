// export const getIntensityColor = (percentage: number) => {
//     if (percentage === 0) return 'var(--color-bg-subtle)';
//     if (percentage < 25) return 'rgba(249, 115, 22, 0.2)';
//     if (percentage < 50) return 'rgba(249, 115, 22, 0.4)';
//     if (percentage < 75) return 'rgba(249, 115, 22, 0.6)';
//     if (percentage < 100) return 'rgba(249, 115, 22, 0.8)';
//     return 'var(--color-primary)';
// };


export const getIntensityColor = (percentage: number, color?: string): string => {
    if (percentage === 0) return 'var(--color-bg-subtle)';

    const base = color ?? '249, 115, 22';

    if (percentage < 25) return `rgba(${base}, 0.2)`;
    if (percentage < 50) return `rgba(${base}, 0.4)`;
    if (percentage < 75) return `rgba(${base}, 0.6)`;
    if (percentage < 100) return `rgba(${base}, 0.8)`;
    return `rgba(${base}, 1)`;
};


export const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
        ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
        : '249, 115, 22'
}