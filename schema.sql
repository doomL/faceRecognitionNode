CREATE DATABASE IF NOT EXISTS recognitioncam;
USE recognitioncam;

CREATE TABLE IF NOT EXISTS `user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `admin` tinyint DEFAULT '0',
  `numVolti` int DEFAULT '0',
  `premium` tinyint DEFAULT '0',
  `plus` tinyint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
