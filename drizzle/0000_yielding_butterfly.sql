CREATE TABLE `canvases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(180) NOT NULL,
	`kind` varchar(120) NOT NULL,
	`price` varchar(40) NOT NULL,
	`size` varchar(80) NOT NULL,
	`status` enum('available','one_of_one','coming_soon','sold') NOT NULL DEFAULT 'available',
	`description` text NOT NULL,
	`imageUrl` text NOT NULL,
	`imageKey` varchar(512),
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `canvases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portfolioImages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`label` varchar(160) NOT NULL,
	`altText` varchar(240) NOT NULL,
	`imageUrl` text NOT NULL,
	`imageKey` varchar(512),
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `portfolioImages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `studioEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(180) NOT NULL,
	`type` enum('studio_visit','group_exhibition','workshop') NOT NULL,
	`description` text NOT NULL,
	`venue` varchar(180) NOT NULL,
	`city` varchar(180) NOT NULL,
	`startAt` timestamp NOT NULL,
	`endAt` timestamp NOT NULL,
	`accent` enum('coral','sage','plum') NOT NULL DEFAULT 'coral',
	`isPublished` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `studioEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
