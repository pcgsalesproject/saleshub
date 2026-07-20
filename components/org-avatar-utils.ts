export function getInitials(name: string, nickname?: string | null): string {
  if (nickname) return nickname.trim().slice(0, 3);
  const inline = name.match(/\(([^)]+)\)/)?.[1];
  if (inline) return inline.trim().slice(0, 3);
  return name.trim().slice(0, 2);
}

export function displayName(name: string, nickname?: string | null): string {
  return nickname ? `${name} (${nickname})` : name;
}
