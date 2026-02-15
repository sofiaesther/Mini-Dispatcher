export interface IMapMarker {
	position: [number, number];
	title?: string;
	description?: string;
	color?: TMapMarkerColor;
	/** CSS color for circle marker (e.g. "red", "#ff0000") */
	customColor?: string;
}

export interface TMapProps {
	center?: [number, number];
	zoom?: number;
	markers?: TMapMarker[];
	height?: string;
	className?: string;
}

export type TMapMarkerColor = 'default' | 'green' | 'purple' | 'black';

export type TMapMarker = {
	position: [number, number];
	title?: string;
	description?: string;
	color?: TMapMarkerColor;
	customColor?: string;
}

export type TGeocodeResult = {
    lat: number;
	lon: number;
	name: string;
};