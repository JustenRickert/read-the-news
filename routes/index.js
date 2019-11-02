const router = require('express').Router();

// API Routes
// router.use('/api', apiRoutes);
router.route('/health').get((req, res) => {
	console.log(req.query.code);
	res.status(200).send('server is healthy!');
});

module.exports = router;
