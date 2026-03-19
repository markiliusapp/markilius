import { useState, useRef, useEffect } from 'react';
import './FloatingAddButton.css';

interface Props {
    onClick: () => void;
}

const BUTTON_SIZE = 56;
const EDGE_PADDING = 20;
// Offset above mobile nav bar (approx 65px tall) + extra padding
const BOTTOM_OFFSET = 100;

const FloatingAddButton = ({ onClick }: Props) => {
    const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
    const dragOffset = useRef({ x: 0, y: 0 });
    const hasMoved = useRef(false);
    const isDragging = useRef(false);
    const btnRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        setPos({
            x: window.innerWidth - BUTTON_SIZE - EDGE_PADDING,
            y: window.innerHeight - BUTTON_SIZE - BOTTOM_OFFSET,
        });
    }, []);

    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        const rect = btnRef.current!.getBoundingClientRect();
        isDragging.current = true;
        hasMoved.current = false;
        dragOffset.current = {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top,
        };
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging.current) return;
        e.preventDefault();
        hasMoved.current = true;
        const touch = e.touches[0];
        const x = Math.max(
            EDGE_PADDING,
            Math.min(window.innerWidth - BUTTON_SIZE - EDGE_PADDING, touch.clientX - dragOffset.current.x)
        );
        const y = Math.max(
            EDGE_PADDING,
            Math.min(window.innerHeight - BUTTON_SIZE - EDGE_PADDING, touch.clientY - dragOffset.current.y)
        );
        setPos({ x, y });
    };

    const handleTouchEnd = () => {
        isDragging.current = false;
        if (!hasMoved.current) {
            onClick();
        }
    };

    if (pos === null) return null;

    return (
        <button
            ref={btnRef}
            className="floating-add-btn"
            style={{ left: pos.x, top: pos.y }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            aria-label="Add task"
        >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
        </button>
    );
};

export default FloatingAddButton;
