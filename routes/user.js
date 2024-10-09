
/**
 * These are example routes for user management
 * This shows how to correctly structure your routes for the project
 */


const express = require("express");
const router = express.Router();
const assert = require('assert');

/**
 * @desc The author home page
 */
router.get("/author-home", async (req, res) => {
	let author;
	let articles;

	// get the author details from database and give it to author-home page
	const authorDetailsQuery = new Promise((resolve, reject) => {
		global.db.all("SELECT * FROM author", function (err, rows) {
			author = JSON.parse(JSON.stringify(rows[0]));
			resolve();
		});
	});

	await authorDetailsQuery;

	// get all articles
	const articlesQuery = new Promise((resolve, reject) => {
		global.db.all("SELECT * FROM articles WHERE authorId = ?", [author.authorID], function (err, rows) {
			articles = rows;
			resolve();
		})
	});

	await articlesQuery;

	res.render("author-home", { author, articles });
})

/**
 * @desc The author settings page
 */
router.get("/author-settings", (req, res) => {
	// get author details and send to html page
	global.db.all("SELECT * FROM author", function (err, rows) {
		let authorDetails = rows[0];

		// color of input fields
		let titleInputColor = "white";
		let subtitleInputColor = "white";
		let authorNameInputColor = "white";

		// if any field is empty, outline it as red otherwise leave it as white
		if (!authorDetails.blogTitle) titleInputColor = "rgb(217, 46, 57)";
		if (!authorDetails.blogSubtitle) subtitleInputColor = "rgb(217, 46, 57)";
		if (!authorDetails.authorName) authorNameInputColor = "rgb(217, 46, 57)";

		// render page
		res.render("author-settings", { authorDetails, titleInputColor, subtitleInputColor, authorNameInputColor });
	})
});

/**
 * @desc The author edit article page page
 */
router.get("/author-edit-article-page", (req, res) => {
	let articleID = req.query.articleID;

	global.db.all("SELECT * FROM articles WHERE articleID = ?", [articleID], function (err, rows) {
		let article = rows[0];

		res.render("author-edit-article-page", { article });
	})
});

/**
 * @desc Update article and save changes
 */
router.post("/update-article", (req, res) => {
	let article = req.body;
	global.db.all("UPDATE articles SET articleName = ?, articleDescription = ?, articleContent = ?, lastModified = DATETIME('now') WHERE articleID = ?",
		[article["article-name"], article["article-description"], article["article-content"], article.articleID], function (err, rows) {
			res.redirect("back");
		})
});

/**
 * @desc Create new article
 */
router.get("/create-new-article", async (req, res) => {

	let createdNewArticle = new Promise((resolve, reject) => {
		global.db.all(`INSERT INTO articles (articleName, articleDescription, state, lastModified, createdOn, articleContent, authorID, publishedOn) 
		VALUES ('New article', '<Article description goes here>', 'draft', DATETIME('now'), DATETIME('now'), 'Content goes here...', 1, DATETIME('now'));`,
			function (err, rows) {
				resolve();
			})
	});

	await createdNewArticle;

	global.db.all("SELECT LAST_INSERT_ROWID()", function (err, rows) {
		articleID = rows[0]['LAST_INSERT_ROWID()'];

		res.redirect(`author-edit-article-page?articleID=${articleID}`);
	})
});

/**
 * @desc Delete an article and return back to original page
 */
router.get("/author-home-delete-article", (req, res) => {
	let articleID = req.query.articleID;

	global.db.all("DELETE FROM articles WHERE articleID = ?", [articleID], function (err, rows) {
		res.redirect("/user/author-home");
	})
});

/**
 * @desc Publishes an article and return back to original page
 */
router.get("/author-home-publish-article", (req, res) => {
	let articleID = req.query.articleID;

	global.db.all("UPDATE articles SET state = 'published', publishedOn = DATETIME('now') WHERE articleID = ?", [articleID], function (err, rows) {
		res.redirect("/user/author-home");
	})
});

/**
 * @desc Updates author details and re directs to author home page
 */
router.get("/author-settings-update", async (req, res) => {
	let blogTitle;
	let blogSubtitle;
	let authorName;

	if (Object.keys(req.query).length == 0) { // coming from back button
		let author;

		const authorDetails = new Promise((resolve, reject) => {
			global.db.all("SELECT * FROM author", function (err, rows) {
				author = rows[0];
				resolve();
			})
		});
		await authorDetails;

		blogTitle = author.blogTitle;
		blogSubtitle = author.blogSubtitle;
		authorName = author.authorName;
	}
	else { // coming from update button
		blogTitle = req.query.blogTitleInput;
		blogSubtitle = req.query.blogSubtitleInput;
		authorName = req.query.authorNameInput;
	}

	global.db.all("UPDATE author SET blogTitle = ?, blogSubtitle = ?, authorName = ? WHERE authorID = 1", [blogTitle, blogSubtitle, authorName], function (err, rows) {
		if (!blogTitle || !blogSubtitle || !authorName) res.redirect("/user/author-settings");
		else res.redirect("/user/author-home");
	});
});

/**
 * @desc Reader - Article Page
 */
router.get("/reader-article-page", async function (req, res) {
	let articleID = req.query.articleID;

	let article;
	let comments;

	let gotArticle = new Promise((resolve, reject) => {
		global.db.all("SELECT * FROM articles WHERE articleID = ?", [articleID], function (err, rows) {
			article = rows[0];
			resolve();
		})
	});

	await gotArticle;

	let gotComments = new Promise((resolve, reject) => {
		global.db.all("SELECT * FROM comments WHERE articleID = ? ORDER BY commentDate DESC", [articleID], function (err, rows) {
			comments = JSON.parse(JSON.stringify(rows));
			resolve();
		})
	});

	await gotComments;

	res.render("reader-article-page", { article, comments, source : req.query.source});
});

/**
 * @desc Reader - home page
 */
router.get("/reader-home", async function (req, res) {
	let author;
	let articles;

	// get the author details from database and give it to author-home page
	const authorDetailsQuery = new Promise((resolve, reject) => {
		global.db.all("SELECT * FROM author", function (err, rows) {
			author = JSON.parse(JSON.stringify(rows[0]));
			resolve();
		});
	});

	await authorDetailsQuery;

	// get all articles
	const articlesQuery = new Promise((resolve, reject) => {
		global.db.all("SELECT * FROM articles WHERE authorId = ? AND state = ? ORDER BY publishedOn DESC", [author.authorID, 'published'], function (err, rows) {
			articles = rows;
			resolve();
		})
	});

	await articlesQuery;

	res.render('reader-home', { author, articles });
});

/**
 * @desc Submit comment 
 */
router.post("/submit-comment", function (req, res) {
	let articleID = req.body.articleID;
	let comment = req.body.comment;

	global.db.all("INSERT INTO comments (commentContent, commentDate, articleID) VALUES (?, DATETIME('NOW'), ?)",
		[comment, articleID]);

	res.redirect(`/user/reader-article-page?articleID=${articleID}&source=${req.body.source}`);
});

/**
 * @desc Increment likes 
 */
router.get("/increment-likes", function (req, res) {
	let articleID = req.query.articleID;

	global.db.all("UPDATE articles SET numberOfLikes = numberOfLikes + 1 WHERE articleID = ?", [articleID], function(err, rows) {
		res.redirect(`reader-article-page?articleID=${articleID}&source=${req.query.source}`);
	});
});



///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**	
 * @desc retrieves the current users
 */
router.get("/get-test-users", (req, res, next) => {

	//Use this pattern to retrieve data
	//NB. it's better NOT to use arrow functions for callbacks with this library
	global.db.all("SELECT * FROM testUsers", function (err, rows) {
		if (err) {
			next(err); //send the error on to the error handler
		} else {
			res.json(rows);
		}
	});

});

/**
 * @desc retrieves the current user records
 */
router.get("/get-user-records", (req, res, next) => {
	//USE this pattern to retrieve data
	//NB. it's better NOT to use arrow functions for callbacks with this library

	global.db.all("SELECT * FROM testUserRecords", function (err, rows) {
		if (err) {
			next(err); //send the error on to the error handler
		} else {
			res.json(rows);
		}
	});
});

/**
 * @desc Renders the page for creating a user record
 */
router.get("/create-user-record", (req, res) => {
	res.render("create-user-record");
});

/**
 * @desc Add a new user record to the database for user id = 1
 */
router.post("/create-user-record", (req, res, next) => {
	//USE this pattern to update and insert data
	//NB. it's better NOT to use arrow functions for callbacks with this library
	const data = generateRandomData(10);
	global.db.run(
		"INSERT INTO testUserRecords ('test_record_value', 'test_user_id') VALUES( ?, ? );",
		[data, 1],
		function (err) {
			if (err) {
				next(err); //send the error on to the error handler
			} else {
				res.send(`New data inserted @ id ${this.lastID}!`);
				next();
			}
		}
	);
});

///////////////////////////////////////////// HELPERS ///////////////////////////////////////////

/**
 * @desc A helper function to generate a random string
 * @returns a random lorem ipsum string
 */
function generateRandomData(numWords = 5) {
	const str =
		"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum";

	const words = str.split(" ");

	let output = "";

	for (let i = 0; i < numWords; i++) {
		output += choose(words);
		if (i < numWords - 1) {
			output += " ";
		}
	}

	return output;
}

/**
 * @desc choose and return an item from an array
 * @returns the item
 */
function choose(array) {
	assert(Array.isArray(array), "Not an array");
	const i = Math.floor(Math.random() * array.length);
	return array[i];
}

module.exports = router;
