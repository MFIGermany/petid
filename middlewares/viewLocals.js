function attachLocals(req, res, next) {

    res.locals.data = {
        baseUrl:
            process.env.APP_URL ||
            `${req.protocol}://${req.get('host')}`,

        user: req.session?.user || null,

        currentPath: req.path,

        appName: 'PetID',

        year: new Date().getFullYear()
    };

    res.locals.flash = req.session?.flash || null;

    if (req.session?.flash) {
        delete req.session.flash;
    }

    next();
}

module.exports = { attachLocals };
