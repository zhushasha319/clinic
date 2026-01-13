URL  = env("DATABASE_URL")

function env(arg0: string): { new(url: string | URL, base?: string | URL): URL; prototype: URL; canParse(url: string | URL, base?: string | URL): boolean; createObjectURL(obj: Blob | MediaSource): string; parse(url: string | URL, base?: string | URL): URL | null; revokeObjectURL(url: string): void; } {
    throw new Error("Function not implemented.");
}
