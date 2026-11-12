CREATE TABLE `prompt_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`flow_name` text(128) NOT NULL,
	`node_name` text(128) NOT NULL,
	`agent_name` text(128),
	`template` text,
	`hexdigest` text(128),
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
