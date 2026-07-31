export function roomLabel(roomNumber?: string | null, roomTypeName?: string | null): string {
	return `${roomNumber ?? "?"} - ${roomTypeName ?? "?"}`;
}
