export type Plugin = {
  id: string;
  name: string;
  description: string;
  author: string;
  repo: string;
  category: string;
  categories?: string[];
  tags?: string[];
  version?: string;
  downloadUrl?: string;
  sha256?: string;
  addedAt: string;
};

export type PluginRegistry = {
  $schema?: string;
  version: number;
  plugins: Plugin[];
};

export type Release = {
  version: string;
  downloadUrl: string;
};

export type Hold = {
  reason: string;
  findings: string[];
};
