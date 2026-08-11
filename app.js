require('dotenv').config();

const path = require('path');
const express = require('express');
const sessionMiddleware = require('./middlewares/session');
const { attachLocals } = require('./middlewares/viewLocals');

const homeRoutes = require('./routes/home');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const petRoutes = require('./routes/pets');
const tagRoutes = require('./routes/tags');
const publicRoutes = require('./routes/public');

const app = express();
const PORT = Number(process.env.PORT || 3002);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'static', 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'static', 'public')));

app.use(sessionMiddleware);
app.use(attachLocals);

app.use((req, res, next) => {

    res.locals.data = {
        baseUrl:
            process.env.APP_URL ||
            `${req.protocol}://${req.get('host')}`,

        currentUser: req.session?.user || null,

        currentPath: req.path,
        appName: 'PetID',
        year: new Date().getFullYear()
    };

    next();
});

app.use('/', homeRoutes);
app.use('/', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/pets', petRoutes);
app.use('/tags', tagRoutes);
app.use('/', publicRoutes);

app.use((req, res) => {
  res.status(404).render('common/error', {
    title: 'Página no encontrada',
    message: 'La página solicitada no existe.'
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('common/error', {
    title: 'Error',
    message: process.env.NODE_ENV === 'production'
      ? 'Ocurrió un error inesperado.'
      : (err.message || 'Ocurrió un error inesperado.')
  });
});

app.listen(PORT, () => {
  console.log(`PetID iniciado en ${process.env.APP_URL || `http://localhost:${PORT}`}`);
});
