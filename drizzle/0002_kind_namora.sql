CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reference` varchar(40) NOT NULL,
	`customerName` varchar(160) NOT NULL,
	`phone` varchar(40) NOT NULL,
	`email` varchar(320),
	`deliveryMethod` varchar(80) NOT NULL,
	`area` varchar(180) NOT NULL,
	`address` text NOT NULL,
	`notes` text,
	`items` text NOT NULL,
	`subtotal` varchar(40) NOT NULL,
	`status` varchar(40) NOT NULL DEFAULT 'new_enquiry',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_reference_unique` UNIQUE(`reference`)
);
