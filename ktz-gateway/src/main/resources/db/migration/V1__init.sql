CREATE TABLE IF NOT EXISTS users (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(100),
    surname       VARCHAR(100),
    username      VARCHAR(100) UNIQUE NOT NULL,
    age           INT DEFAULT 0,
    password      VARCHAR(255) NOT NULL,
    role          VARCHAR(50),
    locomotive_id BIGINT,
    photo_url     VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS locomotives (
    id        BIGSERIAL PRIMARY KEY,
    number    VARCHAR(50) UNIQUE NOT NULL,
    name      VARCHAR(100),
    type      VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS routes (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(100),
    locomotive_id BIGINT
);