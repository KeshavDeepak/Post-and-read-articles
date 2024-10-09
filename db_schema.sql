
-- This makes sure that foreign_key constraints are observed and that errors will be thrown for violations
PRAGMA foreign_keys=ON;

BEGIN TRANSACTION;

-- clear database completely before re-creation
DROP TABLE IF EXISTS articles; 
DROP TABLE IF EXISTS author;
DROP TABLE IF EXISTS comments;

--create your tables with SQL commands here (watch out for slight syntactical differences with SQLite)

CREATE TABLE IF NOT EXISTS author (
    authorID INTEGER PRIMARY KEY NOT NULL,
    authorName TEXT,
    blogTitle TEXT,
    blogSubtitle TEXT
);

CREATE TABLE IF NOT EXISTS articles (
    articleID INTEGER PRIMARY KEY AUTOINCREMENT,
    articleName TEXT NOT NULL,
    articleDescription TEXT,
    state CHECK( state IN ('draft','published') ) NOT NULL,
    lastModified DATETIME NOT NULL,
    createdOn DATETIME NOT NULL,
    articleContent TEXT,
    publishedOn DATETIME,
    numberOfLikes INT DEFAULT 0,

    authorID INTEGER NOT NULL,
    FOREIGN KEY(authorID) REFERENCES author(authorID)
);

CREATE TABLE IF NOT EXISTS comments (
    commentId INTEGER PRIMARY KEY AUTOINCREMENT,
    commentContent TEXT,
    commentDate DATETIME NOT NULL,
    articleID INTEGER NOT NULL,

    FOREIGN KEY(articleID) REFERENCES articles(articleID)
);

-- CREATE TABLE IF NOT EXISTS testUsers (
--     test_user_id INTEGER PRIMARY KEY AUTOINCREMENT,
--     test_name TEXT NOT NULL
-- );

-- CREATE TABLE IF NOT EXISTS testUserRecords (
--     test_record_id INTEGER PRIMARY KEY AUTOINCREMENT,
--     test_record_value TEXT NOT NULL,
--     test_user_id  INT, --the user that the record belongs to
--     FOREIGN KEY (test_user_id) REFERENCES testUsers(test_user_id)
-- );

--insert default data (if necessary here)

INSERT INTO author (authorID, authorName, blogTitle, blogSubtitle) VALUES (1, 'Author', 'My blog', 'Example subtitle');

INSERT INTO articles (articleName, articleDescription, state, lastModified, createdOn, articleContent, authorID) 
VALUES ('Article 1', 'Article 1 is about Einstein', 'draft', DATETIME('now'), DATETIME('now'), 'Lorem Ipsum dolor sit amet', 1);

INSERT INTO articles (articleName, articleDescription, state, lastModified, createdOn, articleContent, authorID) 
VALUES ('Article 2', 'Article 2 is about headphones', 'draft', DATETIME('now'), DATETIME('now'), 'Lorem Ipsum dolor sit amet', 1);

INSERT INTO articles (articleName, articleDescription, state, lastModified, createdOn, articleContent, authorID, publishedOn) 
VALUES ('Article 3 published!', 'Article 3 is about laser tag', 'published', DATETIME('now'), DATETIME('now'), 'Lorem Ipsum dolor sit amet', 1, DATETIME('now'));

-- INSERT INTO testUsers (test_name) VALUES ('Simon Star');
-- INSERT INTO testUserRecords (test_record_value, test_user_id) VALUES( 'Lorem ipsum dolor sit amet', 1); --try changing the test_user_id to a different number and you will get an error

COMMIT;

