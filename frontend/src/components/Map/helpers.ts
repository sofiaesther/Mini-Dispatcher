'use client';

import L from "leaflet";
import { TMapMarkerColor } from "./IMap";

const createCircleIconForColor = (color: TMapMarkerColor) => {
	if (typeof window === 'undefined') return undefined;
	const safe = color.trim() || '#6366f1';
	return L.divIcon({
		className: 'custom-marker-circle',
		html: `<div style="width:24px;height:24px;border-radius:50%;background:${safe};border:3px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>`,
		iconSize: [24, 24],
		iconAnchor: [12, 12],
	});
};

export { createCircleIconForColor };
